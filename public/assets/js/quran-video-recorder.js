/**
 * ============================================================
 *  QURAN VIDEO RECORDER - Shorts & Normal Mode
 *  Modul untuk merekam video ayat Al-Qur'an
 *  dengan sinkronisasi audio dan highlight kata.
 * ============================================================
 *
 *  Fitur:
 *  - Mode Shorts (9:16 portrait, YouTube-style)
 *  - Word-by-word highlighting di canvas
 *  - Background gambar/video custom
 *  - Recording menggunakan MediaRecorder API
 *  - Download & Share (WA/Telegram)
 *  - Auto-play dari URL parameters
 *
 *  Dependencies:
 *  - Bootstrap 5 (Modal)
 *  - quran-audio-player.js (fungsi highlight & timing)
 *  - Browser MediaRecorder + Canvas API
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    // =====================================================
    //  ELEMENT REFERENCES
    // =====================================================
    const showVideoButton = document.getElementById('showVideoButton');
    if (!showVideoButton) return;

    const ayatVideoModalElement = document.getElementById('ayatVideoModal');
    if (!ayatVideoModalElement) return;

    const ayatVideoModal = new bootstrap.Modal(ayatVideoModalElement);
    const ayatVideoModalBody = document.getElementById('ayatVideoModalBody');

    // =====================================================
    //  DATA DARI BLADE (diset via data-attributes di HTML)
    // =====================================================
    const dataContainer = document.getElementById('video-data-config');
    if (!dataContainer) return;

    const allAyatOnPage = JSON.parse(dataContainer.dataset.ayat || '[]');
    const style = dataContainer.dataset.style;
    const lastVerse = parseInt(dataContainer.dataset.lastVerse);
    const chapterName = dataContainer.dataset.chapterName;
    const chapterId = parseInt(dataContainer.dataset.chapterId);
    const reciterId = parseInt(dataContainer.dataset.reciterId);
    const publicOrigin = dataContainer.dataset.publicOrigin;

    const originForShare = (!publicOrigin || /^(https?:\/\/)?(\localhost|127\.|::1)/.test(publicOrigin))
        ? window.location.origin
        : publicOrigin;

    // =====================================================
    //  BACKGROUND & COLOR SETTINGS STATE
    // =====================================================
    let userBgImage = null;
    let userBgVideo = null;
    let bgType = null; // 'image' | 'video'

    let videoTextColor = localStorage.getItem('quran_video_text_color') || '#ffffff';
    let videoBgColor = localStorage.getItem('quran_video_bg_color') || '#182d41';
    let videoBgOpacity = parseFloat(localStorage.getItem('quran_video_bg_opacity') ?? '1.0');
    if (isNaN(videoBgOpacity)) videoBgOpacity = 1.0;

    // Helper: Convert Hex + Opacity (0-1) to RGBA string
    function hexToRgba(hex, opacity) {
        if (!hex) return `rgba(0, 51, 173, ${opacity})`;
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Settings Modal DOM Elements
    const videoSettingsModalEl = document.getElementById('videoSettingsModal');
    const textColorPicker = document.getElementById('textColorPicker');
    const textColorHex = document.getElementById('textColorHex');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const bgColorHex = document.getElementById('bgColorHex');
    const bgOpacityRange = document.getElementById('bgOpacityRange');
    const bgOpacityValue = document.getElementById('bgOpacityValue');
    const bgImageInputModal = document.getElementById('bgImageInputModal');
    const bgStatusBadge = document.getElementById('bgStatusBadge');
    const removeBgBtn = document.getElementById('removeBgBtn');
    const previewArabicText = document.getElementById('previewArabicText');
    const previewTransText = document.getElementById('previewTransText');
    const settingsPreviewBox = document.getElementById('settingsPreviewBox');
    const resetVideoSettingsBtn = document.getElementById('resetVideoSettingsBtn');

    // =====================================================
    //  BACKGROUND MANAGEMENT
    // =====================================================

    /**
     * Update background modal dengan gambar/video yang diupload.
     */
    function updateModalBackground() {
        const modalContent = document.querySelector('.shorts-mode-modal .modal-content');
        if (!modalContent) return;

        // Hapus video background yang sudah ada
        const existingBgVideo = modalContent.querySelector('.bg-video-element');
        if (existingBgVideo) existingBgVideo.remove();

        if (bgType === 'video' && userBgVideo) {
            modalContent.style.backgroundImage = '';
            modalContent.style.boxShadow = '';

            // Buat elemen <video> sebagai background
            const bgVideoEl = document.createElement('video');
            bgVideoEl.className = 'bg-video-element';
            bgVideoEl.src = userBgVideo.src;
            bgVideoEl.muted = true;
            bgVideoEl.loop = true;
            bgVideoEl.autoplay = true;
            bgVideoEl.playsInline = true;
            bgVideoEl.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                object-fit: cover; z-index: 0; pointer-events: none;
            `;
            modalContent.style.position = 'relative';
            modalContent.prepend(bgVideoEl);
            bgVideoEl.play().catch(() => {});

            // Overlay gelap
            let overlay = modalContent.querySelector('.bg-video-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'bg-video-overlay';
                overlay.style.cssText = `
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.4); z-index: 1; pointer-events: none;
                `;
                modalContent.insertBefore(overlay, modalContent.children[1]);
            }

            // Pastikan konten di atas overlay
            const modalHeader = modalContent.querySelector('.modal-header');
            const modalBody = modalContent.querySelector('.modal-body');
            if (modalHeader) modalHeader.style.zIndex = '5';
            if (modalBody) modalBody.style.zIndex = '5';

        } else if (bgType === 'image' && userBgImage) {
            modalContent.style.backgroundImage = `url(${userBgImage.src})`;
            modalContent.style.backgroundSize = 'cover';
            modalContent.style.backgroundPosition = 'center';
            modalContent.style.boxShadow = 'inset 0 0 0 2000px rgba(0, 0, 0, 0.4)';
        }
    }

    /** Pause background video */
    function stopBgVideo() {
        if (userBgVideo) userBgVideo.pause();
        const bgVideoEl = document.querySelector('.bg-video-element');
        if (bgVideoEl) bgVideoEl.pause();
    }

    /** Restart & play background video */
    function startBgVideo() {
        if (bgType === 'video' && userBgVideo) {
            userBgVideo.currentTime = 0;
            userBgVideo.play().catch(() => {});
        }
        const bgVideoEl = document.querySelector('.bg-video-element');
        if (bgVideoEl) {
            bgVideoEl.currentTime = 0;
            bgVideoEl.play().catch(() => {});
        }
    }


    // =====================================================
    //  SETTINGS MODAL & BACKGROUND HANDLER
    // =====================================================
    function updateBgStatusUI() {
        if (!bgStatusBadge) return;
        if (bgType === 'video' && userBgVideo) {
            bgStatusBadge.className = 'badge bg-success';
            bgStatusBadge.textContent = 'Video Terpasang';
            if (removeBgBtn) removeBgBtn.style.display = 'inline-block';
        } else if (bgType === 'image' && userBgImage) {
            bgStatusBadge.className = 'badge bg-success';
            bgStatusBadge.textContent = 'Gambar Terpasang';
            if (removeBgBtn) removeBgBtn.style.display = 'inline-block';
        } else {
            bgStatusBadge.className = 'badge bg-secondary';
            bgStatusBadge.textContent = 'Default';
            if (removeBgBtn) removeBgBtn.style.display = 'none';
        }
    }

    // Helper: Dynamically scale box-shadow and text-shadow with background opacity
    function applyDynamicShadows(element, opacity, baseBoxAlpha = 0.3, baseTextAlpha = 0.9) {
        if (!element) return;
        const boxAlpha = (baseBoxAlpha * opacity).toFixed(2);
        const textAlpha = (baseTextAlpha * (1 - opacity)).toFixed(2);

        element.style.boxShadow = opacity > 0 ? `0 4px 10px rgba(0, 0, 0, ${boxAlpha})` : 'none';
        element.style.textShadow = opacity < 1 ? `0 2px 8px rgba(0, 0, 0, ${textAlpha})` : 'none';
    }

    function updateSettingsPreview() {
        const curTextColor = textColorPicker ? textColorPicker.value : videoTextColor;
        const curBgColor = bgColorPicker ? bgColorPicker.value : videoBgColor;
        const curOpacity = bgOpacityRange ? parseFloat(bgOpacityRange.value) / 100 : videoBgOpacity;

        if (bgOpacityValue) {
            bgOpacityValue.textContent = `${Math.round(curOpacity * 100)}%`;
        }

        const rgbaBg = hexToRgba(curBgColor, curOpacity);

        if (previewArabicText) {
            previewArabicText.style.color = curTextColor;
            previewArabicText.style.backgroundColor = rgbaBg;
            applyDynamicShadows(previewArabicText, curOpacity);
        }

        if (previewTransText) {
            previewTransText.style.color = curTextColor;
            previewTransText.style.backgroundColor = rgbaBg;
            applyDynamicShadows(previewTransText, curOpacity);
        }

        if (settingsPreviewBox) {
            if (bgType === 'image' && userBgImage) {
                settingsPreviewBox.style.backgroundImage = `url(${userBgImage.src})`;
                settingsPreviewBox.style.backgroundSize = 'cover';
                settingsPreviewBox.style.backgroundPosition = 'center';
            } else {
                settingsPreviewBox.style.backgroundImage = '';
            }
        }
    }

    function syncSettingsModalUI() {
        if (textColorPicker) textColorPicker.value = videoTextColor;
        if (textColorHex) textColorHex.value = videoTextColor;
        if (bgColorPicker) bgColorPicker.value = videoBgColor;
        if (bgColorHex) bgColorHex.value = videoBgColor;
        if (bgOpacityRange) bgOpacityRange.value = Math.round(videoBgOpacity * 100);

        updateBgStatusUI();
        updateSettingsPreview();
    }

    if (videoSettingsModalEl) {
        videoSettingsModalEl.addEventListener('show.bs.modal', function () {
            syncSettingsModalUI();
        });
    }

    if (textColorPicker) {
        textColorPicker.addEventListener('input', (e) => {
            if (textColorHex) textColorHex.value = e.target.value;
            videoTextColor = e.target.value;
            localStorage.setItem('quran_video_text_color', videoTextColor);
            updateSettingsPreview();
        });
    }

    if (textColorHex) {
        textColorHex.addEventListener('change', (e) => {
            let hex = e.target.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                if (textColorPicker) textColorPicker.value = hex;
                videoTextColor = hex;
                localStorage.setItem('quran_video_text_color', videoTextColor);
                updateSettingsPreview();
            }
        });
    }

    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            if (bgColorHex) bgColorHex.value = e.target.value;
            videoBgColor = e.target.value;
            localStorage.setItem('quran_video_bg_color', videoBgColor);
            updateSettingsPreview();
        });
    }

    if (bgColorHex) {
        bgColorHex.addEventListener('change', (e) => {
            let hex = e.target.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                if (bgColorPicker) bgColorPicker.value = hex;
                videoBgColor = hex;
                localStorage.setItem('quran_video_bg_color', videoBgColor);
                updateSettingsPreview();
            }
        });
    }

    if (bgOpacityRange) {
        bgOpacityRange.addEventListener('input', (e) => {
            videoBgOpacity = parseFloat(e.target.value) / 100;
            localStorage.setItem('quran_video_bg_opacity', videoBgOpacity);
            updateSettingsPreview();
        });
    }

    if (resetVideoSettingsBtn) {
        resetVideoSettingsBtn.addEventListener('click', () => {
            videoTextColor = '#ffffff';
            videoBgColor = '#182d41';
            videoBgOpacity = 1.0;
            localStorage.setItem('quran_video_text_color', videoTextColor);
            localStorage.setItem('quran_video_bg_color', videoBgColor);
            localStorage.setItem('quran_video_bg_opacity', videoBgOpacity);
            syncSettingsModalUI();
        });
    }

    function handleBgFileUpload(file) {
        if (!file) return;

        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            const videoUrl = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.src = videoUrl;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.crossOrigin = 'anonymous';

            video.onloadeddata = function () {
                userBgVideo = video;
                userBgImage = null;
                bgType = 'video';
                updateModalBackground();
                updateBgStatusUI();
                updateSettingsPreview();
                alert("Video latar berhasil terpasang!");
            };

            video.onerror = function () {
                alert("Gagal memuat video. Coba format lain (MP4/WebM).");
            };

            video.load();
        } else {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    userBgImage = img;
                    userBgVideo = null;
                    bgType = 'image';
                    updateModalBackground();
                    updateBgStatusUI();
                    updateSettingsPreview();
                    alert("Gambar latar berhasil terpasang untuk video!");
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    if (bgImageInputModal) {
        bgImageInputModal.onchange = function (e) {
            handleBgFileUpload(e.target.files[0]);
        };
    }

    const bgInput = document.getElementById('bgImageInput');
    if (bgInput) {
        bgInput.onchange = function (e) {
            handleBgFileUpload(e.target.files[0]);
        };
    }

    if (removeBgBtn) {
        removeBgBtn.addEventListener('click', () => {
            userBgImage = null;
            userBgVideo = null;
            bgType = null;
            if (bgImageInputModal) bgImageInputModal.value = '';
            if (bgInput) bgInput.value = '';
            updateModalBackground();
            updateBgStatusUI();
            updateSettingsPreview();
        });
    }


    /**
     * Membersihkan tag HTML dari string terjemahan dan membatasi panjang teks jika terlalu panjang.
     * Menggunakan regex cepat tanpa instance DOMParser agar aman dipanggil berulang kali.
     */
    function stripHtml(html, maxLength = 160) {
        if (!html) return '';
        let text = html.replace(/<[^>]*>?/gm, '').trim();
        if (maxLength > 0 && text.length > maxLength) {
            text = text.substring(0, maxLength).trim() + '...';
        }
        return text;
    }

    // =====================================================
    //  HIGHLIGHT COMPUTATION (Pure Function)
    // =====================================================

    /**
     * Menghitung index kata yang harus di-highlight.
     * Pure function tanpa side effects.
     *
     * @param {number} currentTimeMs - Posisi audio saat ini (ms)
     * @param {Array}  segments      - Segment timing
     * @param {number} wordCount     - Jumlah kata
     * @returns {number} Index kata yang harus di-highlight (-1 jika tidak ada)
     */
    function computeHighlightIndex(currentTimeMs, segments, wordCount) {
        if (!segments || segments.length === 0 || wordCount === 0) return -1;

        const maxIndex = wordCount - 1;
        const segCount = segments.length;
        let newIndex = -1;

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
        return newIndex;
    }


    // =====================================================
    //  SHOW VIDEO BUTTON HANDLER
    // =====================================================
    showVideoButton.addEventListener('click', async function () {
        const startVerseInput = document.getElementById('start_verse');
        const endVerseInput = document.getElementById('end_verse');
        const isShortsMode = true; // Mode Shorts aktif secara default

        let startVerse = parseInt(startVerseInput.value);
        let endVerse = parseInt(endVerseInput.value);

        // Default: semua ayat
        if (!startVerseInput.value && !endVerseInput.value) {
            startVerse = 1;
            endVerse = lastVerse;
        } else if (isNaN(startVerse) || isNaN(endVerse) || startVerse < 1 || startVerse > endVerse) {
            alert('Masukkan rentang ayat yang valid.');
            return;
        }

        // Filter ayat dalam rentang
        const ayatInRange = allAyatOnPage.filter(
            ayah => ayah.number >= startVerse && ayah.number <= endVerse
        );

        if (ayatInRange.length === 0) {
            ayatVideoModalBody.innerHTML = '<p class="text-center">Ayat dalam rentang yang dipilih tidak ditemukan di halaman ini.</p>';
            ayatVideoModal.show();
            return;
        }

        // Setup modal styling (Shorts mode)
        ayatVideoModalElement.classList.add('shorts-mode-modal');
        ayatVideoModalElement.classList.remove('ayat-video-modal');
        ayatVideoModalElement.querySelector('.modal-dialog').classList.remove('modal-fullscreen');

        ayatVideoModalBody.innerHTML = `
            <div id="video-content-container" class="shorts-ayat-container"></div>
            <div class="shorts-progress-bar" id="shorts-progress-bar" style="width: 0%;"></div>
        `;

        if (userBgImage || userBgVideo) {
            setTimeout(updateModalBackground, 50);
        }

        const videoContainer = document.getElementById('video-content-container');
        const progressBar = document.getElementById('shorts-progress-bar');

        // Audio player untuk video mode
        const audioPlayer = new Audio();
        audioPlayer.crossOrigin = "anonymous";
        document.body.appendChild(audioPlayer);

        let currentAudioIndex = 0;
        let shortsHighlightIndex = -1;

        // =====================================================
        //  AUDIO SOURCE COLLECTION
        // =====================================================
        const audioSrcs = [];
        for (const ayah of ayatInRange) {
            const sourceElement = document.getElementById(`audio${ayah.number}`);
            let audioUrl = null;

            if (sourceElement && sourceElement.src) {
                audioUrl = sourceElement.src;
            } else if (ayah.url) {
                audioUrl = ayah.url.startsWith('http') ? ayah.url : `${window.location.origin}/${ayah.url}`;
            } else {
                try {
                    const resp = await fetch(`/kpjoko2/public/getAudioVerse/${reciterId}/${chapterId}/${ayah.number}`);
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.url) {
                            audioUrl = data.url.startsWith('http') ? data.url : `${window.location.origin}/${data.url}`;
                        }
                    }
                } catch (e) {
                    console.log(`Could not fetch audio for ayah ${ayah.number}:`, e);
                }
            }

            if (audioUrl) {
                audioSrcs.push({
                    number: ayah.number,
                    url: audioUrl,
                    style_text: ayah[style],
                    numberArab: ayah.numberArab || ayah.number.toString(),
                    translation_text: ayah.short_translation_text || ayah.translation_text,
                    transliteration: ayah.transliteration,
                    chapter_name: chapterName,
                });
            }
        }

        // Validasi audio
        const rangeRequestedCount = (endVerse - startVerse) + 1;
        if (audioSrcs.length < rangeRequestedCount && audioSrcs.length > 0) {
            const foundVerses = audioSrcs.map(a => a.number).join(', ');
            if (!confirm(`Hanya ${audioSrcs.length} dari ${rangeRequestedCount} ayat yang ditemukan (${foundVerses}). Lanjutkan?`)) {
                return;
            }
        }

        if (audioSrcs.length === 0) {
            alert('Tidak ada audio yang ditemukan untuk rentang ayat tersebut.');
            return;
        }

        // =====================================================
        //  SHARE DATA
        // =====================================================
        const firstAyah = audioSrcs[0];
        const lastAyah = audioSrcs[audioSrcs.length - 1];
        const rangeText = audioSrcs.length > 1
            ? `${firstAyah.number}-${lastAyah.number}`
            : firstAyah.number;
        const shareUrl = originForShare + window.location.pathname +
            `?chapter=${chapterId}&play_start=${firstAyah.number}&play_end=${lastAyah.number}`;

        const shareMessageWA = `Tonton video lantunan Surah ${firstAyah.chapter_name} ayat ${rangeText} di e-Mufassir.\n\n${shareUrl}`;
        const shareMessageTG = `Tonton video lantunan Surah ${firstAyah.chapter_name} ayat ${rangeText} di e-Mufassir.`;

        // =====================================================
        //  WORD HIGHLIGHT & LAYOUT CACHE STATE
        // =====================================================
        let currentWordSegments = [];
        let currentHighlightIndex = -1;
        let cachedDOMWordElements = [];
        let currentCanvasLayoutCache = null;

        // Pre-fetch chapter timings
        fetchChapterTimings(chapterId, reciterId).catch(() => {});

        /**
         * Update highlight kata di DOM.
         */
        function updateDOMHighlight(newHighlightIndex) {
            if (!cachedDOMWordElements || cachedDOMWordElements.length === 0) {
                cachedDOMWordElements = Array.from(document.querySelectorAll('.video-word'));
            }
            if (cachedDOMWordElements.length === 0) return;

            cachedDOMWordElements.forEach((word, idx) => {
                const isHighlighted = idx === newHighlightIndex;
                const wasHighlighted = idx < newHighlightIndex;

                if (isHighlighted) {
                    word.classList.add('highlight');
                    word.classList.remove('was-highlighted');
                    word.style.color = '#FFD700';
                    word.style.textShadow = 'none';
                    word.style.opacity = "1";
                } else if (wasHighlighted || (newHighlightIndex === -1 && currentHighlightIndex >= 0)) {
                    word.classList.remove('highlight');
                    word.classList.add('was-highlighted');
                    word.style.color = videoTextColor;
                    word.style.textShadow = 'none';
                    word.style.opacity = '';
                } else {
                    word.classList.remove('highlight', 'was-highlighted');
                    word.style.color = videoTextColor;
                    word.style.textShadow = 'none';
                    word.style.opacity = '';
                }
            });
        }

        /**
         * Update highlight kata di DOM berdasarkan posisi audio.
         */
        function updateWordHighlight(currentTime) {
            if (currentWordSegments.length === 0) return;

            const currentTimeMs = currentTime * 1000;
            if (!cachedDOMWordElements || cachedDOMWordElements.length === 0) {
                cachedDOMWordElements = Array.from(document.querySelectorAll('.video-word'));
            }
            if (cachedDOMWordElements.length === 0) return;

            let newHighlightIndex = computeHighlightIndex(currentTimeMs, currentWordSegments, cachedDOMWordElements.length);

            if (audioPlayer.ended || (audioPlayer.duration && audioPlayer.currentTime > audioPlayer.duration - 0.15)) {
                newHighlightIndex = cachedDOMWordElements.length - 1;
            }

            if (newHighlightIndex !== currentHighlightIndex) {
                updateDOMHighlight(newHighlightIndex);
                currentHighlightIndex = newHighlightIndex;
            }
        }

        // =====================================================
        //  CANVAS LAYOUT BUILDER (Pre-calculation)
        // =====================================================

        /**
         * Membangun cache layout canvas untuk 1 ayat (font size, lines, rects, offsets).
         * Dijalankan 1x saat ganti ayat, bukan di setiap frame render loop!
         */
        function buildCanvasLayout(ayah, width, height) {
            if (!recordCtx) setupRecordCanvas();

            const cleanTrans = stripHtml(ayah.translation_text);
            const words = ayah.style_text.split(' ');
            const maxWidth = width * 0.85;
            const maxTextHeight = height * 0.7;

            let fontSize = 90;
            let lines = [];
            let totalTextHeight = 0;
            let lineHeight = 0;

            recordCtx.save();
            while (fontSize > 40) {
                recordCtx.font = `${fontSize}px "Scheherazade New", serif`;
                lineHeight = fontSize * 2.0;
                lines = [];
                let currentLine = [];

                words.forEach((word) => {
                    const testLine = [...currentLine, word].join(' ');
                    if (recordCtx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
                        lines.push(currentLine);
                        currentLine = [word];
                    } else {
                        currentLine.push(word);
                    }
                });
                lines.push(currentLine);
                totalTextHeight = lines.length * lineHeight;

                if (totalTextHeight <= maxTextHeight) break;
                fontSize -= 5;
            }

            const startY = cleanTrans
                ? (height * 0.42) - (totalTextHeight / 2)
                : (height * 0.5) - (totalTextHeight / 2);

            recordCtx.font = `${fontSize}px "Scheherazade New", serif`;

            const arabicLines = lines.map((lineWords, lineIdx) => {
                const lineText = lineWords.join(' ');
                const lineWidth = recordCtx.measureText(lineText).width;

                const rectH = fontSize * 1.5;
                const rectW = lineWidth + (fontSize * 0.6);
                const rectX = width / 2 - lineWidth / 2 - (fontSize * 0.3);
                const rectY = startY + (lineIdx * lineHeight) - (fontSize * 0.9);

                const wordWidths = lineWords.map(w => recordCtx.measureText(w + ' ').width);

                return {
                    words: lineWords,
                    wordWidths: wordWidths,
                    lineWidth: lineWidth,
                    rectX: rectX,
                    rectY: rectY,
                    rectW: rectW,
                    rectH: rectH
                };
            });

            const arabicFont = `${fontSize}px "Scheherazade New", serif`;
            const numberY = startY + totalTextHeight + 60;
            const numberFont = `bold ${Math.min(60, fontSize * 0.7)}px Arial`;
            const surahInfoFont = `${Math.min(40, fontSize * 0.5)}px Arial`;

            let transLineObjects = [];
            let transFont = '';

            if (cleanTrans) {
                const fullTransText = `${cleanTrans}`;
                const transFontSize = Math.min(32, Math.max(22, Math.round(fontSize * 0.38)));
                const transLineHeight = transFontSize * 1.5;
                const maxTransWidth = width * 0.85;

                transFont = `${transFontSize}px Arial, sans-serif`;
                recordCtx.font = transFont;

                const transWords = fullTransText.split(' ');
                let transLines = [];
                let curTransLine = [];

                transWords.forEach((w) => {
                    const testLine = [...curTransLine, w].join(' ');
                    if (recordCtx.measureText(testLine).width > maxTransWidth && curTransLine.length > 0) {
                        transLines.push(curTransLine.join(' '));
                        curTransLine = [w];
                    } else {
                        curTransLine.push(w);
                    }
                });
                if (curTransLine.length > 0) {
                    transLines.push(curTransLine.join(' '));
                }

                const transStartY = numberY + 60;
                transLineObjects = transLines.map((tLine, tIdx) => {
                    recordCtx.font = transFont;
                    const tLineWidth = recordCtx.measureText(tLine).width;
                    const rectH = transFontSize * 1.4;
                    const rectW = tLineWidth + (transFontSize * 1.0);
                    const rectX = width / 2 - tLineWidth / 2 - (transFontSize * 0.5);
                    const rectY = transStartY + (tIdx * transLineHeight) - (rectH / 2);

                    return {
                        text: tLine,
                        y: transStartY + (tIdx * transLineHeight),
                        rectX: rectX,
                        rectY: rectY,
                        rectW: rectW,
                        rectH: rectH
                    };
                });
            }

            recordCtx.restore();

            return {
                ayahNumber: ayah.number,
                fontSize: fontSize,
                lineHeight: lineHeight,
                startY: startY,
                arabicLines: arabicLines,
                arabicFont: arabicFont,
                numberY: numberY,
                numberFont: numberFont,
                surahInfoFont: surahInfoFont,
                cleanTrans: cleanTrans,
                transFont: transFont,
                transLines: transLineObjects
            };
        }

        // =====================================================
        //  DISPLAY AYAH IN VIDEO MODE
        // =====================================================

        /**
         * Menampilkan ayat di kontainer video dan load segments.
         */
        async function displayAyah(index) {
            const ayah = audioSrcs[index];
            const words = ayah.style_text.split(' ');
            const wordsHtml = words.map((word, idx) =>
                `<span class="video-word" data-word-index="${idx}">${word}</span>`
            ).join(' ');

            const cleanTranslation = stripHtml(ayah.translation_text);
            const translationHtml = cleanTranslation ? `
                <div class="shorts-translation-wrapper">
                    <div class="shorts-translation-text">${cleanTranslation}</div>
                </div>
            ` : '';

            videoContainer.innerHTML = `
                <div class="shorts-ayat-text" id="shorts-ayat-display">${wordsHtml}</div>
                <div class="shorts-ayat-number">${ayah.numberArab}</div>
                ${translationHtml}
                <div class="shorts-surah-info">
                    <span>${ayah.chapter_name}</span> • <span>Ayat ${ayah.number}</span>
                </div>
            `;

            // Apply user text color and background color / opacity with dynamic shadows
            const rgbaBg = hexToRgba(videoBgColor, videoBgOpacity);

            const displayEl = document.getElementById('shorts-ayat-display');
            if (displayEl) {
                displayEl.style.color = videoTextColor;
                displayEl.style.backgroundColor = rgbaBg;
                applyDynamicShadows(displayEl, videoBgOpacity);
                let fontSize = 2.2;
                const minFontSize = 1.0;
                const maxHeight = videoContainer.clientHeight * 0.45;
                while (displayEl.scrollHeight > maxHeight && fontSize > minFontSize) {
                    fontSize -= 0.1;
                    displayEl.style.fontSize = fontSize + 'rem';
                    displayEl.style.lineHeight = "2.0";
                }
            }

            const transEl = document.querySelector('.shorts-translation-text');
            if (transEl) {
                transEl.style.color = videoTextColor;
                transEl.style.backgroundColor = rgbaBg;
                applyDynamicShadows(transEl, videoBgOpacity);

                // Auto-size: kecilkan font terjemahan sampai muat dalam area yang tersedia
                const transWrapper = document.querySelector('.shorts-translation-wrapper');
                const maxTransHeight = videoContainer.clientHeight * 0.28;
                let transFontSize = 1.0;
                const transMinFontSize = 0.55;
                transEl.style.fontSize = transFontSize + 'rem';
                transEl.style.lineHeight = '1.6';
                while (transWrapper && transWrapper.scrollHeight > maxTransHeight && transFontSize > transMinFontSize) {
                    transFontSize = Math.round((transFontSize - 0.05) * 100) / 100;
                    transEl.style.fontSize = transFontSize + 'rem';
                }
            }

            // Cache elemen DOM & layout canvas 1x untuk ayat ini
            cachedDOMWordElements = Array.from(document.querySelectorAll('.video-word'));
            currentCanvasLayoutCache = buildCanvasLayout(ayah, 1080, 1920);

            // Reset state
            currentHighlightIndex = -1;
            currentWordSegments = [];

            // Load segments dari API
            try {
                const segments = await fetchWordSegments(chapterId, ayah.number, reciterId);
                if (segments && segments.length > 0) {
                    currentWordSegments = segments;
                    console.log(`Ayat ${ayah.number}: ${segments.length} segments loaded`);
                }
            } catch (e) {
                console.log('Segment fetch error for ayat', ayah.number, e);
            }

            // Click-to-seek pada kata
            cachedDOMWordElements.forEach((word, idx) => {
                word.style.cursor = 'pointer';
                word.onclick = () => {
                    if (currentWordSegments && currentWordSegments[idx]) {
                        audioPlayer.currentTime = currentWordSegments[idx][1] / 1000;
                        audioPlayer.play();
                    }
                };
            });

            // Fallback segments jika API gagal
            audioPlayer.addEventListener('loadedmetadata', () => {
                if (currentWordSegments.length === 0) {
                    currentWordSegments = generateFallbackSegments(cachedDOMWordElements, audioPlayer.duration);
                    console.log(`Ayat ${ayah.number}: Fallback segments generated`);
                }
            }, { once: true });

            // Pre-fetch segments ayat berikutnya
            if (index + 1 < audioSrcs.length) {
                const nextAyah = audioSrcs[index + 1];
                fetchWordSegments(chapterId, nextAyah.number, reciterId).catch(() => {});
            }
        }

        // =====================================================
        //  PROGRESS BAR
        // =====================================================
        function updateProgressBar() {
            if (progressBar && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                const currentProgress = audioPlayer.currentTime / audioPlayer.duration;
                const totalProgress = ((currentAudioIndex + currentProgress) / audioSrcs.length) * 100;
                progressBar.style.width = Math.min(100, Math.max(0, totalProgress)) + '%';
            }
        }

        // =====================================================
        //  FINISHED CARD
        // =====================================================

        /**
         * Menampilkan kartu selesai setelah pemutaran/rekaman berakhir.
         */
        function displayFinishedCard(file = null) {
            stopBgVideo();

            let actionButtons = '';

            if (file) {
                actionButtons = `
                    <div class="d-flex flex-column align-items-center gap-2">
                        <button id="downloadVideoButton" class="btn btn-primary px-4" title="Simpan Video">
                            <i class="ri-download-line"></i> Simpan Video
                        </button>
                        <div class="d-flex justify-content-center gap-2">
                            <button id="shareWAButton" class="btn btn-success text-white" style="background-color:#25D366;border:none;" title="Kirim ke WhatsApp">
                                <i class="ri-whatsapp-fill"></i> WA
                            </button>
                            <button id="shareTGButton" class="btn btn-info text-white" style="background-color:#0088cc;border:none;" title="Kirim ke Telegram">
                                <i class="ri-telegram-fill"></i> TG
                            </button>
                        </div>
                    </div>
                    <p class="text-light small mt-2 fst-italic">*Klik WA/TG untuk unduh & buka aplikasi</p>
                `;
            } else {
                actionButtons = `
                    <div class="btn-group">
                        <button type="button" class="btn btn-info dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="ri-share-line"></i> Bagikan Link
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="https://wa.me/?text=${encodeURIComponent(shareMessageWA)}" target="_blank"><i class="ri-whatsapp-fill"></i> WhatsApp</a></li>
                            <li><a class="dropdown-item" href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessageTG)}" target="_blank" rel="noopener noreferrer"><i class="ri-telegram-fill"></i> Telegram</a></li>
                        </ul>
                    </div>
                `;
            }

            videoContainer.innerHTML = `
                <div class="shorts-finished-card">
                    <i class="ri-checkbox-circle-fill icon"></i>
                    <h3>Selesai</h3>
                    <p>${file ? 'Video berhasil direkam.' : 'Terima kasih, pemutaran telah selesai.'}</p>
                    <div class="d-flex flex-column align-items-center w-100">
                        <div class="mb-3">${actionButtons}</div>
                        <div>
                            <button id="replayButton" class="btn btn-success me-2">Putar Lagi</button>
                            <button class="btn btn-outline-light" data-bs-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            `;

            // Event listeners untuk tombol-tombol
            if (file) {
                const dlBtn = document.getElementById('downloadVideoButton');
                const waBtn = document.getElementById('shareWAButton');
                const tgBtn = document.getElementById('shareTGButton');

                const downloadAndOpen = (url) => {
                    downloadFile(file, file.name, false);
                    setTimeout(() => {
                        alert("PENTING: Browser tidak mengizinkan pengiriman file otomatis.\n\n1. Video TELAH DISIMPAN.\n2. Aplikasi akan terbuka.\n3. Silakan LAMPIRKAN file video secara manual.");
                        window.open(url, '_blank');
                    }, 1000);
                };

                if (dlBtn) dlBtn.addEventListener('click', () => downloadFile(file, file.name));
                if (waBtn) waBtn.addEventListener('click', () => downloadAndOpen('https://wa.me/'));
                if (tgBtn) tgBtn.addEventListener('click', () => downloadAndOpen('https://t.me/share/url?url=' + encodeURIComponent(window.location.href)));
            }

            // Tombol replay
            const replay = document.getElementById('replayButton');
            if (replay) {
                replay.addEventListener('click', async () => {
                    currentAudioIndex = 0;
                    shortsHighlightIndex = -1;
                    startBgVideo();
                    await ensureFontsLoaded();
                    startRecordingSequence();
                });
            }
        }

        // =====================================================
        //  PLAY NEXT AUDIO
        // =====================================================
        async function playNextAudio() {
            if (currentAudioIndex >= audioSrcs.length) {
                if (isRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
                    videoContainer.innerHTML = `
                        <div class="d-flex flex-column justify-content-center align-items-center" style="min-height:380px;">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-3">Memproses Video...</p>
                        </div>
                    `;
                    mediaRecorder.stop();
                } else {
                    displayFinishedCard();
                }
                return;
            }

            await displayAyah(currentAudioIndex);

            const currentAudio = audioSrcs[currentAudioIndex];
            audioPlayer.src = currentAudio.url;
            shortsHighlightIndex = -1;

            audioPlayer.play().catch(error => {
                console.error("Audio play error:", error);
                setTimeout(() => audioPlayer.dispatchEvent(new Event('ended')), 500);
            });

            audioPlayer.onerror = () => {
                console.error("Audio Load Error at index:", currentAudioIndex);
                setTimeout(() => audioPlayer.dispatchEvent(new Event('ended')), 1000);
            };
        }

        audioPlayer.onended = () => {
            currentAudioIndex++;
            playNextAudio();
        };

        // =====================================================
        //  HIGHLIGHT SYNC (non-recording)
        // =====================================================
        let animationFrameId;

        function syncHighlight() {
            if (!audioPlayer.paused && !isRecording) {
                updateWordHighlight(audioPlayer.currentTime);
                updateProgressBar();
            }
            if (!isRecording) {
                animationFrameId = requestAnimationFrame(syncHighlight);
            }
        }

        audioPlayer.onplay = () => {
            if (!isRecording) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(syncHighlight);
            }
        };

        audioPlayer.onpause = () => cancelAnimationFrame(animationFrameId);

        // =====================================================
        //  FONT LOADING
        // =====================================================
        async function ensureFontsLoaded() {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
        }

        // =====================================================
        //  MODAL CLOSE HANDLER
        // =====================================================
        ayatVideoModalElement.addEventListener('hidden.bs.modal', function () {
            audioPlayer.pause();
            cancelAnimationFrame(animationFrameId);
            currentAudioIndex = 0;
            shortsHighlightIndex = -1;
            stopBgVideo();
            if (document.body.contains(audioPlayer)) {
                document.body.removeChild(audioPlayer);
            }
            ayatVideoModalElement.classList.add('shorts-mode-modal');
            ayatVideoModalElement.classList.remove('ayat-video-modal');
            ayatVideoModalElement.querySelector('.modal-dialog').classList.remove('modal-fullscreen');
        });

        // =====================================================
        //  RECORDING VARIABLES
        // =====================================================
        let isRecording = false;
        let mediaRecorder;
        let recordedChunks = [];
        let stream;
        let recordCanvas;
        let recordCtx;

        /** Setup canvas untuk recording */
        function setupRecordCanvas() {
            recordCanvas = document.createElement('canvas');
            // Selalu portrait untuk mode Shorts
            recordCanvas.width = 1080;
            recordCanvas.height = 1920;
            recordCtx = recordCanvas.getContext('2d');
        }

        // =====================================================
        //  CANVAS FRAME RENDERER
        // =====================================================

        /**
         * Menggambar satu frame ke canvas untuk recording.
         * Menggunakan layout yang sudah di-cache untuk kecepatan maksimal.
         */
        function drawFrame() {
            if (!isRecording || !recordCtx) return;

            const width = recordCanvas.width;
            const height = recordCanvas.height;

            // -- Helper: Cover-fit drawing --
            function drawCoverFit(source, srcW, srcH) {
                const imgRatio = srcW / srcH;
                const canvasRatio = width / height;
                let drawWidth, drawHeight, x, y;

                if (imgRatio > canvasRatio) {
                    drawHeight = height;
                    drawWidth = height * imgRatio;
                    x = (width - drawWidth) / 2;
                    y = 0;
                } else {
                    drawWidth = width;
                    drawHeight = width / imgRatio;
                    x = 0;
                    y = (height - drawHeight) / 2;
                }
                recordCtx.drawImage(source, x, y, drawWidth, drawHeight);
                recordCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                recordCtx.fillRect(0, 0, width, height);
            }

            // 1. Draw Background
            if (bgType === 'video' && userBgVideo && userBgVideo.readyState >= 2) {
                drawCoverFit(userBgVideo, userBgVideo.videoWidth, userBgVideo.videoHeight);
            } else if (bgType === 'image' && userBgImage) {
                drawCoverFit(userBgImage, userBgImage.width, userBgImage.height);
            } else {
                const gradient = recordCtx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#050a05');
                gradient.addColorStop(0.5, '#0d1a0d');
                gradient.addColorStop(1, '#1a331a');
                recordCtx.fillStyle = gradient;
                recordCtx.fillRect(0, 0, width, height);
            }

            const ayah = audioSrcs[currentAudioIndex];
            if (!ayah) return;

            const wordCount = ayah.style_text.split(' ').length;

            // 2. Compute highlight index
            let canvasHighlightIdx = -1;
            if (!audioPlayer.paused && currentWordSegments.length > 0) {
                const currentTimeMs = audioPlayer.currentTime * 1000;
                canvasHighlightIdx = computeHighlightIndex(currentTimeMs, currentWordSegments, wordCount);
            }
            if (audioPlayer.ended || (audioPlayer.duration && audioPlayer.currentTime > audioPlayer.duration - 0.15)) {
                canvasHighlightIdx = wordCount - 1;
            }

            // 3. Update DOM highlight
            if (canvasHighlightIdx !== currentHighlightIndex) {
                updateDOMHighlight(canvasHighlightIdx);
                currentHighlightIndex = canvasHighlightIdx;
            }

            updateProgressBar();

            // 4. Pastikan layout cache tersedia
            if (!currentCanvasLayoutCache || currentCanvasLayoutCache.ayahNumber !== ayah.number) {
                currentCanvasLayoutCache = buildCanvasLayout(ayah, width, height);
            }

            const layout = currentCanvasLayoutCache;
            const r = 8;

            // 5. Gambar background kotak Arab (jika opacity > 0)
            if (videoBgOpacity > 0) {
                recordCtx.fillStyle = hexToRgba(videoBgColor, videoBgOpacity);
                layout.arabicLines.forEach(line => {
                    recordCtx.beginPath();
                    recordCtx.moveTo(line.rectX + r, line.rectY);
                    recordCtx.arcTo(line.rectX + line.rectW, line.rectY, line.rectX + line.rectW, line.rectY + line.rectH, r);
                    recordCtx.arcTo(line.rectX + line.rectW, line.rectY + line.rectH, line.rectX, line.rectY + line.rectH, r);
                    recordCtx.arcTo(line.rectX, line.rectY + line.rectH, line.rectX, line.rectY, r);
                    recordCtx.arcTo(line.rectX, line.rectY, line.rectX + line.rectW, line.rectY, r);
                    recordCtx.closePath();
                    recordCtx.fill();
                });
            }

            // 6. Gambar Kata Arab (RTL)
            recordCtx.font = layout.arabicFont;
            recordCtx.direction = 'rtl';
            recordCtx.textAlign = 'center';
            recordCtx.textBaseline = 'middle';

            let wordCounter = 0;
            layout.arabicLines.forEach((line, lineIdx) => {
                let currentX = width / 2 + line.lineWidth / 2;

                line.words.forEach((word, wIdx) => {
                    const wordWidth = line.wordWidths[wIdx];
                    const isHighlighted = wordCounter === canvasHighlightIdx;
                    const wasHighlighted = wordCounter < canvasHighlightIdx;

                    if (isHighlighted) {
                        recordCtx.fillStyle = '#FFD700';
                    } else {
                        recordCtx.fillStyle = videoTextColor;
                    }
                    recordCtx.shadowBlur = 0;

                    recordCtx.fillText(word, currentX - wordWidth / 2, layout.startY + (lineIdx * layout.lineHeight));

                    currentX -= wordWidth;
                    wordCounter++;
                });
            });

            recordCtx.shadowBlur = 0;

            // 7. Nomor Ayat
            recordCtx.direction = 'ltr';
            recordCtx.fillStyle = '#8dc63f';
            recordCtx.font = layout.numberFont;
            recordCtx.fillText(ayah.numberArab, width / 2, layout.numberY);

            // 8. Terjemahan Ayat (jika ada)
            if (layout.cleanTrans && layout.transLines.length > 0) {
                const tr = 6;
                if (videoBgOpacity > 0) {
                    recordCtx.fillStyle = hexToRgba(videoBgColor, videoBgOpacity);
                    layout.transLines.forEach(tLine => {
                        recordCtx.beginPath();
                        recordCtx.moveTo(tLine.rectX + tr, tLine.rectY);
                        recordCtx.arcTo(tLine.rectX + tLine.rectW, tLine.rectY, tLine.rectX + tLine.rectW, tLine.rectY + tLine.rectH, tr);
                        recordCtx.arcTo(tLine.rectX + tLine.rectW, tLine.rectY + tLine.rectH, tLine.rectX, tLine.rectY + tLine.rectH, tr);
                        recordCtx.arcTo(tLine.rectX, tLine.rectY + tLine.rectH, tLine.rectX, tLine.rectY, tr);
                        recordCtx.arcTo(tLine.rectX, tLine.rectY, tLine.rectX + tLine.rectW, tLine.rectY, tr);
                        recordCtx.closePath();
                        recordCtx.fill();
                    });
                }

                recordCtx.font = layout.transFont;
                recordCtx.direction = 'ltr';
                recordCtx.textAlign = 'center';
                recordCtx.textBaseline = 'middle';
                recordCtx.fillStyle = videoTextColor;
                recordCtx.shadowBlur = 0;

                layout.transLines.forEach(tLine => {
                    recordCtx.fillText(tLine.text, width / 2, tLine.y);
                });
            }

            // 9. Info Surah
            recordCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            recordCtx.font = layout.surahInfoFont;
            recordCtx.fillText(`${ayah.chapter_name} • Ayat ${ayah.number}`, width / 2, height - 120);

            // 10. Progress Bar
            let progress = 0;
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                progress = (currentAudioIndex + (audioPlayer.currentTime / audioPlayer.duration)) / audioSrcs.length;
            } else {
                progress = currentAudioIndex / audioSrcs.length;
            }
            progress = Math.min(1, Math.max(0, progress));
            recordCtx.fillStyle = '#8dc63f';
            recordCtx.fillRect(0, height - 20, width * progress, 20);

            if (isRecording) requestAnimationFrame(drawFrame);
        }

        // =====================================================
        //  RECORDING SEQUENCE
        // =====================================================
        let audioCtx, audioSource, audioDestination;

        async function startRecordingSequence() {
            try {
                setupRecordCanvas();

                if (bgType === 'video' && userBgVideo) {
                    userBgVideo.currentTime = 0;
                    await userBgVideo.play().catch(() => {});
                }

                // Canvas stream
                const canvasStream = recordCanvas.captureStream(30);

                // Audio stream
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }

                audioSource = audioCtx.createMediaElementSource(audioPlayer);
                audioDestination = audioCtx.createMediaStreamDestination();
                audioSource.connect(audioDestination);
                audioSource.connect(audioCtx.destination);

                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }

                // Combine streams
                const combinedStream = new MediaStream([
                    ...canvasStream.getVideoTracks(),
                    ...audioDestination.stream.getAudioTracks()
                ]);

                const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                    ? 'video/webm;codecs=vp9,opus'
                    : 'video/webm';

                mediaRecorder = new MediaRecorder(combinedStream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 5000000
                });

                recordedChunks = [];
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) recordedChunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    isRecording = false;
                    const blob = new Blob(recordedChunks, { type: mimeType });
                    const fileName = `Video-Surah-${chapterName}-Ayat-${rangeText}.webm`;
                    const file = new File([blob], fileName, { type: mimeType });
                    displayFinishedCard(file);
                };

                // Start recording
                isRecording = true;
                mediaRecorder.start();
                drawFrame();

                currentAudioIndex = 0;
                playNextAudio();

            } catch (err) {
                console.error("Recording error:", err);
                currentAudioIndex = 0;
                playNextAudio();
            }
        }

        // =====================================================
        //  FILE DOWNLOAD HELPER
        // =====================================================
        function downloadFile(blob, name, showAlert = true) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                if (showAlert) {
                    alert("Video telah disimpan! Silakan bagikan file tersebut secara manual.");
                }
            }, 100);
        }

        // =====================================================
        //  START
        // =====================================================
        ayatVideoModal.show();

        setTimeout(async () => {
            await ensureFontsLoaded();
            startRecordingSequence();
        }, 500);
    });

    // =====================================================
    //  AUTO-PLAY DARI URL PARAMETERS
    // =====================================================
    const urlParams = new URLSearchParams(window.location.search);
    const playStart = urlParams.get('play_start');
    const playEnd = urlParams.get('play_end');

    if (playStart && playEnd) {
        const startVerseInput = document.getElementById('start_verse');
        const endVerseInput = document.getElementById('end_verse');

        if (startVerseInput && endVerseInput && showVideoButton) {
            startVerseInput.value = playStart;
            endVerseInput.value = playEnd;
            setTimeout(() => showVideoButton.click(), 100);
        }
    }
});
