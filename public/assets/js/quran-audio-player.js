/**
 * ============================================================
 *  QURAN AUDIO PLAYER - Word-by-Word Highlighting
 *  Modul untuk memutar audio per-ayat dengan sinkronisasi
 *  highlight kata secara real-time.
 * ============================================================
 *
 *  Fungsi utama:
 *  - fetchChapterTimings()  : Mengambil data timing dari Quran.com API
 *  - fetchWordSegments()    : Mendapatkan segment per-ayat
 *  - normalizeSegments()    : Menormalisasi data timing
 *  - playMusic()            : Memutar audio per-ayat dengan highlight
 *  - shareAyat()            : Membagikan ayat via Web Share API
 *  - clearWordHighlights()  : Menghapus highlight dari kata-kata
 *
 *  Dependencies:
 *  - Bootstrap 5 (Modal)
 *  - Browser Web Audio API
 * ============================================================
 */

// =====================================================
//  GLOBAL STATE VARIABLES
// =====================================================
let currentlyPlaying = null;
let currentlyHighlightedAyat = null;
let highlightedWordIndex = -1;
let chapterTimingsCache = {};
let activeFrameId = null;

/** Offset sinkronisasi audio (ms) */
const SYNC_OFFSET = 0;


// =====================================================
//  SHARE AYAT (Web Share API / Fallback Modal)
// =====================================================

/**
 * Membagikan ayat melalui Web Share API atau fallback ke modal Bootstrap.
 *
 * @param {string} ayahId        - ID ayat
 * @param {string} surahName     - Nama surah
 * @param {string} ayahNumber    - Nomor ayat
 * @param {string} uthmaniText   - Teks Arab Uthmani
 * @param {string} translationText - Teks terjemahan
 * @param {Event}  event         - Event dari click
 */
function shareAyat(ayahId, surahName, ayahNumber, uthmaniText, translationText, event) {
    event.preventDefault();

    const shareData = {
        title: 'Qur\'an: ' + surahName + ' Ayat ' + ayahNumber,
        text: uthmaniText + '\n\nArtinya: "' + translationText + '"' +
              '\n\n(Q.S. ' + surahName + ': ' + ayahNumber + ')',
        url: window.location.href.split('#')[0] + '#ayat' + ayahNumber
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Successfully shared'))
            .catch((error) => {
                console.log('Error sharing:', error);
                const shareModal = new bootstrap.Modal(
                    document.getElementById('staticBackdrop' + ayahId)
                );
                shareModal.show();
            });
    } else {
        const shareModal = new bootstrap.Modal(
            document.getElementById('staticBackdrop' + ayahId)
        );
        shareModal.show();
    }
}


// =====================================================
//  QURAN.COM API - CHAPTER TIMINGS
// =====================================================

/**
 * Mengambil data timing per-kata dari Quran.com QDC API.
 * Data di-cache berdasarkan chapter + reciter.
 *
 * @param {number} chapterNum - Nomor surah (1-114)
 * @param {number} reciterId  - ID qori
 * @returns {Object|null} Map verseNum -> { timestampFrom, timestampTo, duration, segments }
 */
async function fetchChapterTimings(chapterNum, reciterId) {
    const cacheKey = `${chapterNum}:${reciterId}`;
    if (chapterTimingsCache[cacheKey]) return chapterTimingsCache[cacheKey];

    try {
        const response = await fetch(
            `https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/audio_files?chapter=${chapterNum}&segments=true`
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (data.audio_files && data.audio_files[0] && data.audio_files[0].verse_timings) {
            const verseTimingsMap = {};
            data.audio_files[0].verse_timings.forEach(vt => {
                const verseNum = parseInt(vt.verse_key.split(':')[1]);
                verseTimingsMap[verseNum] = {
                    timestampFrom: vt.timestamp_from,
                    timestampTo: vt.timestamp_to,
                    duration: vt.duration,
                    segments: vt.segments || []
                };
            });
            chapterTimingsCache[cacheKey] = verseTimingsMap;
            return verseTimingsMap;
        }
        return null;
    } catch (error) {
        console.log('Error fetching chapter timings:', error);
        return null;
    }
}


// =====================================================
//  SEGMENT NORMALIZATION
// =====================================================

/**
 * Menormalisasi segment mentah dari API menjadi array bersih dan sekuensial.
 *
 * Proses:
 * 1. Filter segment tidak valid (< 3 elemen)
 * 2. Konversi timestamp absolut → relatif
 * 3. Merge duplikat word index
 * 4. Sort berdasarkan startMs
 * 5. Re-index sekuensial (0, 1, 2, ...)
 *
 * @param {Array}  rawSegments   - Segment mentah [wordIdx, startMs, endMs]
 * @param {number} verseStartMs  - Timestamp awal ayat dari chapter audio
 * @returns {Array|null} Segment yang sudah dinormalisasi
 */
function normalizeSegments(rawSegments, verseStartMs) {
    if (!rawSegments || rawSegments.length === 0) return null;

    // Filter segment valid (minimal 3 elemen: wordIndex, startMs, endMs)
    const validSegments = rawSegments.filter(s => Array.isArray(s) && s.length >= 3);
    if (validSegments.length === 0) return null;

    // Konversi ke timestamp relatif & group by word index
    const wordMap = new Map();
    validSegments.forEach(s => {
        const wordIdx = s[0];
        const startMs = s[1] - verseStartMs;
        const endMs = s[2] - verseStartMs;

        if (wordMap.has(wordIdx)) {
            const existing = wordMap.get(wordIdx);
            existing.startMs = Math.min(existing.startMs, startMs);
            existing.endMs = Math.max(existing.endMs, endMs);
        } else {
            wordMap.set(wordIdx, { startMs, endMs });
        }
    });

    // Sort & re-index
    const sorted = Array.from(wordMap.values()).sort((a, b) => a.startMs - b.startMs);
    return sorted.map((seg, idx) => [idx, seg.startMs, seg.endMs]);
}


/**
 * Mengambil word segments untuk ayat tertentu, mengkonversi
 * timestamp absolut ke relatif (dari audio per-ayat mulai 0ms).
 *
 * @param {number} chapterNum - Nomor surah
 * @param {number} verseNum   - Nomor ayat
 * @param {number} reciterId  - ID qori
 * @returns {Array|null} Segment yang sudah dinormalisasi
 */
async function fetchWordSegments(chapterNum, verseNum, reciterId) {
    const timings = await fetchChapterTimings(chapterNum, reciterId);
    if (!timings || !timings[verseNum]) return null;

    const verseTiming = timings[verseNum];
    const rawSegments = verseTiming.segments;
    const verseStartMs = verseTiming.timestampFrom;

    const normalized = normalizeSegments(rawSegments, verseStartMs);
    if (!normalized || normalized.length === 0) return null;

    console.log(`Ayah ${verseNum}: ${rawSegments.length} raw -> ${normalized.length} normalized segments, duration: ${verseTiming.duration}ms`);
    return normalized;
}


// =====================================================
//  TAJWEED ANALYSIS (untuk fallback timing estimasi)
// =====================================================

/**
 * Menganalisis metadata Tajweed dari kata Arab untuk estimasi durasi.
 * Digunakan ketika data timing dari API tidak tersedia.
 *
 * @param {string} word - Kata Arab
 * @returns {Object} { weight, rule, color }
 */
function getTajweedMetadata(word) {
    let weight = 0;
    let rule = 'normal';
    let color = '#2ca4ab';

    // Harakat pendek
    const shortVowels = (word.match(/[\u064E\u0650\u064F\u064B\u064C\u064D]/g) || []).length;
    weight += shortVowels * 1.0;

    // Mad Ashli (mad 2 harakat)
    const madAshliCount = (word.match(/[\u064E][\u0627\u0649]|[\u0650][\u064A]|[\u064F][\u0648]|[\u0670\u06E5\u06E6]/g) || []).length;
    weight += madAshliCount * 1.5;
    if (madAshliCount > 0) { rule = 'mad-ashli'; color = '#ffc107'; }

    // Mad Far'i & Mad Lazim
    const madMaddah = (word.match(/[\u0653]/g) || []).length;
    const madLazim = (word.match(/[\u06E4]/g) || []).length;
    if (madLazim > 0) {
        weight += madLazim * 6.0;
        rule = 'mad-lazim';
        color = '#dc3545';
    } else if (madMaddah > 0) {
        weight += madMaddah * 4.5;
        rule = 'mad-fari';
        color = '#fd7e14';
    }

    // Ghunnah
    const ghunnah = (word.match(/[\u0646\u0645][\u0651]/g) || []).length;
    if (ghunnah > 0) {
        weight += ghunnah * 2.5;
        rule = 'ghunnah';
        color = '#20c997';
    } else {
        weight += (word.match(/[\u0651]/g) || []).length * 1.2;
    }

    // Sukun & Waqaf
    weight += (word.match(/[\u0652]/g) || []).length * 0.5;
    weight += (word.match(/[\u06D6-\u06DC]/g) || []).length * 4.5;

    if (weight < 1.0) weight = 1.0 + (word.length * 0.15);
    return { weight, rule, color };
}


/**
 * Membuat fallback segments berdasarkan durasi audio dan bobot Tajweed.
 * Digunakan ketika API timing tidak tersedia.
 *
 * @param {NodeList} wordElements - Elemen span kata Arab dari DOM
 * @param {number}   duration     - Durasi audio dalam detik
 * @returns {Array} Segment timing [[index, startMs, endMs], ...]
 */
function generateFallbackSegments(wordElements, duration) {
    const segments = [];
    const durationMs = duration * 1000;
    const audioStartBuffer = 200;
    const audioEndBuffer = 500;
    const effectiveDurationMs = Math.max(0, durationMs - audioStartBuffer - audioEndBuffer);

    let totalWeight = 0;
    const wordData = Array.from(wordElements).map((el, i) => {
        const text = el.textContent.trim();
        const meta = getTajweedMetadata(text);
        let weight = meta.weight;

        // Kata terakhir biasanya lebih panjang (ada waqaf)
        if (i === wordElements.length - 1) weight *= 3.8;

        // Kata tengah ayat panjang biasanya ada jeda
        if (wordElements.length > 15 && i === Math.floor(wordElements.length / 2)) weight *= 1.8;

        totalWeight += weight;
        return { weight, color: meta.color };
    });

    let accumulatedMs = audioStartBuffer;
    wordData.forEach((data, i) => {
        const wordRatio = data.weight / totalWeight;
        const wordDurationMs = wordRatio * effectiveDurationMs;
        segments.push([i, Math.floor(accumulatedMs), Math.floor(accumulatedMs + wordDurationMs)]);
        accumulatedMs += wordDurationMs;
    });

    return segments;
}


// =====================================================
//  WORD HIGHLIGHT MANAGEMENT
// =====================================================

/**
 * Menghapus semua highlight dari kata-kata pada ayat tertentu.
 *
 * @param {number} verseNumber - Nomor ayat
 */
function clearWordHighlights(verseNumber) {
    const words = document.querySelectorAll(`.arabic-word[id^="word-${verseNumber}-"]`);
    words.forEach(word => word.classList.remove('highlight-word'));
    highlightedWordIndex = -1;
}


// =====================================================
//  AUDIO PLAYER - Per-Ayat dengan Highlight
// =====================================================

/**
 * Memutar audio ayat dengan sinkronisasi highlight per-kata.
 * Jika ayat sedang diputar, maka akan di-pause.
 *
 * @param {number} verseNumber - Nomor ayat yang akan diputar
 * @param {number} chapterId   - ID chapter/surah (dari Blade)
 * @param {number} reciterId   - ID reciter/qori (dari Blade)
 */
async function playMusic(verseNumber, chapterId, reciterId) {
    const audio = document.getElementById('myAudio' + verseNumber);
    const ayatDiv = document.getElementById('ayat' + verseNumber);
    const musicButton = document.getElementById('musicButton' + verseNumber);
    const smallinButton = musicButton.querySelector('small');

    // Toggle pause jika ayat yang sama sedang diputar
    if (currentlyPlaying === audio) {
        audio.pause();
        return;
    }

    // Hentikan audio yang sedang diputar
    if (currentlyPlaying) {
        currentlyPlaying.pause();
        if (activeFrameId) cancelAnimationFrame(activeFrameId);
    }

    currentlyPlaying = audio;
    currentlyHighlightedAyat = ayatDiv;
    ayatDiv.classList.add('highlight-ayat');
    smallinButton.textContent = 'Stop';

    const words = ayatDiv.querySelectorAll('.arabic-word');
    let segments = null;

    // Fetch segments dari QDC API SEBELUM memutar audio
    try {
        segments = await fetchWordSegments(chapterId, verseNumber, reciterId);
        console.log(`Ayah ${verseNumber} segments:`,
            segments ? `${segments.length} from API` : 'Using fallback');
    } catch (e) {
        console.log('Segment fetch error:', e);
    }

    // Generate fallback jika API gagal
    if (!segments && audio.duration) {
        segments = generateFallbackSegments(words, audio.duration);
    }

    /**
     * Update highlight kata berdasarkan posisi audio saat ini.
     * Dipanggil setiap frame via requestAnimationFrame.
     */
    const updateHighlight = () => {
        if (audio.paused && audio.currentTime === 0) return;

        const currentTimeMs = audio.currentTime * 1000;

        if (!segments && audio.duration) {
            segments = generateFallbackSegments(words, audio.duration);
        }
        if (!segments || segments.length === 0) return;

        let newIndex = -1;
        const maxIndex = words.length - 1;
        const segCount = segments.length;

        // Cari segment yang aktif berdasarkan startMs/endMs
        for (let i = 0; i < segCount; i++) {
            const startMs = segments[i][1];
            const endMs = segments[i][2];

            if (currentTimeMs >= startMs && currentTimeMs < endMs) {
                newIndex = Math.min(Math.round(i * maxIndex / Math.max(segCount - 1, 1)), maxIndex);
                break;
            } else if (currentTimeMs >= startMs) {
                newIndex = Math.min(Math.round(i * maxIndex / Math.max(segCount - 1, 1)), maxIndex);
            }
        }

        if (newIndex > maxIndex) newIndex = maxIndex;

        // Force highlight kata terakhir saat audio hampir selesai
        if (audio.ended || (audio.duration && audio.currentTime > audio.duration - 0.2)) {
            newIndex = maxIndex;
        }

        // Update highlight jika berubah
        if (newIndex !== highlightedWordIndex) {
            if (highlightedWordIndex !== -1 && words[highlightedWordIndex]) {
                words[highlightedWordIndex].classList.remove('highlight-word');
            }
            if (newIndex !== -1 && words[newIndex]) {
                words[newIndex].classList.add('highlight-word');
            }
            highlightedWordIndex = newIndex;
        }
    };

    // Click listener pada kata untuk seeking
    words.forEach((word, idx) => {
        if (!word.dataset.hasListener) {
            word.onclick = (e) => {
                e.stopPropagation();
                if (!segments && audio.duration) {
                    segments = generateFallbackSegments(words, audio.duration);
                }
                if (segments && segments[idx]) {
                    audio.currentTime = segments[idx][1] / 1000;
                    audio.play();
                }
            };
            word.dataset.hasListener = "true";
        }
    });

    // Sinkronisasi highlight dengan requestAnimationFrame
    const sync = () => {
        updateHighlight();
        if (!audio.paused) activeFrameId = requestAnimationFrame(sync);
    };

    // Event handlers audio
    audio.onplay = () => activeFrameId = requestAnimationFrame(sync);

    audio.onpause = () => {
        cancelAnimationFrame(activeFrameId);
        if (audio.currentTime === 0 || audio.ended) {
            ayatDiv.classList.remove('highlight-ayat');
            smallinButton.textContent = 'Play';
            clearWordHighlights(verseNumber);
            currentlyPlaying = null;
        } else {
            smallinButton.textContent = 'Resume';
        }
    };

    audio.onended = () => {
        smallinButton.textContent = 'Play';
        ayatDiv.classList.remove('highlight-ayat');
        clearWordHighlights(verseNumber);
        currentlyPlaying = null;
    };

    audio.onseeked = updateHighlight;
    audio.play().catch(e => console.error("Play failed:", e));
}
