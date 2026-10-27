<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Recitation;
use App\Models\Tafsir;
use App\Models\Translations;
use App\Models\Verse;
use App\Models\VerseAudios;
use App\Models\VerseTafsir;
use Illuminate\Http\Request;

/**
 * ChapterController
 *
 * Mengelola halaman surah dan ayat Al-Qur'an.
 * - index()          : Halaman utama daftar surah
 * - show()           : Halaman baca ayat per surah
 * - getVerseTafsir() : API endpoint tafsir per-ayat
 * - getAudioVerse()  : API endpoint audio per-ayat
 */
class ChapterController extends Controller
{
    /**
     * Halaman utama: Menampilkan daftar semua surah.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $chapter = Chapter::join('chapter_translations', 'chapters.id', '=', 'chapter_translations.id_chapter')
            ->where('chapter_translations.id_language', 13)
            ->select('chapters.*', 'chapter_translations.text AS translate_text')
            ->get();

        return view('landing_page.layout.home', compact('chapter'));
    }

    /**
     * Mengkonversi angka Western Arabic ke Eastern Arabic.
     * Contoh: 123 → ١٢٣
     *
     * @param  int|string $number
     * @return string
     */
    public function arabicNumber($number)
    {
        $western = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

        return str_replace($western, $eastern, strval($number));
    }

    /**
     * Halaman baca ayat: Menampilkan ayat-ayat dari surah tertentu
     * dengan terjemahan, tafsir, dan audio.
     *
     * @param  \App\Models\Chapter  $chapter
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function show(Chapter $chapter, Request $request)
    {
        $chapterId = $chapter->id;

        // Parameter dari request (dengan default values)
        $reciter_Id    = $request->input('audio', 7);
        $translationId = $request->input('translation', 174);
        $verse_page    = $request->input('verse_page', $chapter->verse_count);
        $style         = $request->input('style', 'text_uthmani');
        $tafsirId      = $request->input('tafsir', 2);

        // Query ayat dengan relasi terjemahan, tafsir, dan audio
        $ayat = Verse::join('verse_translations', 'verses.id', '=', 'verse_translations.id_verse')
            ->join('verse_tafsirs', 'verses.id', '=', 'verse_tafsirs.id_verse')
            ->join('verse_audios', 'verses.id', '=', 'verse_audios.id_verse')
            ->join('chapters', 'verses.id_chapter', '=', 'chapters.id')
            ->join('tafsirs', 'verse_tafsirs.id_tafsir', '=', 'tafsirs.id')
            ->where('verses.id_chapter', $chapterId)
            ->where('verse_translations.id_translation', $translationId)
            ->where('verse_tafsirs.id_tafsir', $tafsirId)
            ->where('verse_audios.id_recitation', $reciter_Id)
            ->select(
                'verses.*',
                'verse_translations.text AS translation_text',
                'verse_tafsirs.text AS tafsir_text',
                'tafsirs.name AS name_tafsir',
                'verse_audios.url',
                'chapters.name'
            )
            ->paginate($verse_page);

        // Data pendukung
        $surahNow             = Chapter::where('id', $chapterId)->get();
        $surahs               = Chapter::all();
        $tafsirs              = Tafsir::all();
        $tafsirSelected       = Tafsir::findOrFail($tafsirId);
        $recitations          = Recitation::all();
        $reciterSelected      = Recitation::findOrFail($reciter_Id);
        $translations         = Translations::all()->groupBy('language_name')->sortBy(fn($group, $lang) => $lang);
        $translationsSelected = Translations::findOrFail($translationId);

        // Konversi nomor ayat ke angka Arab & gunakan terjemahan yang dipilih untuk video
        foreach ($ayat as $ayah) {
            $ayah->numberArab = $this->arabicNumber($ayah->number);
            $ayah->short_translation_text = $ayah->translation_text;
        }

        // Meta tags dinamis untuk SEO & Social Sharing
        $playStart = $request->input('play_start');
        $playEnd   = $request->input('play_end');

        if ($playStart && $playEnd) {
            $meta_title       = "Video Surah " . $chapter->name . " Ayat $playStart-$playEnd";
            $meta_description = "Tonton lantunan merdu Surah " . $chapter->name .
                " ayat $playStart s.d. $playEnd lengkap dengan teks Arab dan terjemahan di E-Mufassir.";
        } else {
            $meta_title       = "Surah " . $chapter->name . " - E-Mufassir";
            $meta_description = "Baca, dengarkan, dan pelajari Surah " . $chapter->name .
                " full ayat dengan tafsir dan terjemahan.";
        }

        return view('landing_page.layout.ayat', compact(
            'ayat',
            'surahNow',
            'surahs',
            'tafsirs',
            'tafsirSelected',
            'tafsirId',
            'chapter',
            'style',
            'recitations',
            'reciterSelected',
            'chapterId',
            'translations',
            'translationsSelected',
            'verse_page',
            'reciter_Id',
            'translationId',
            'meta_title',
            'meta_description'
        ));
    }

    /**
     * API: Mengambil tafsir untuk ayat tertentu.
     *
     * @param  int $id_tafsir  ID sumber tafsir
     * @param  int $id_verse   ID ayat
     * @return \Illuminate\Http\JsonResponse
     */
    public function getVerseTafsir($id_tafsir, $id_verse)
    {
        try {
            $tafsirList = VerseTafsir::join('tafsirs', 'verse_tafsirs.id_tafsir', '=', 'tafsirs.id')
                ->where('id_tafsir', $id_tafsir)
                ->where('id_verse', $id_verse)
                ->firstOrFail();

            return response()->json($tafsirList);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * API: Mengambil URL audio untuk ayat tertentu.
     *
     * @param  int $id_reciter    ID qori/reciter
     * @param  int $id_chapter    ID surah
     * @param  int $verse_number  Nomor ayat
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAudioVerse($id_reciter, $id_chapter, $verse_number)
    {
        try {
            $verse = Verse::where('id_chapter', $id_chapter)
                ->where('number', $verse_number)
                ->firstOrFail();

            $audioList = VerseAudios::join('recitations', 'verse_audios.id_recitation', '=', 'recitations.id')
                ->where('id_recitation', $id_reciter)
                ->where('id_verse', $verse->id)
                ->firstOrFail();

            return response()->json($audioList);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
