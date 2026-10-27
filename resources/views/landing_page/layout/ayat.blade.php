{{--
|--------------------------------------------------------------------------
| Halaman Baca Ayat Al-Qur'an
|--------------------------------------------------------------------------
|
| Menampilkan ayat-ayat Al-Qur'an per surah dengan fitur:
| - Audio per-ayat dengan word-by-word highlighting
| - Video recorder mode Shorts (9:16)
| - Simpan Video
|
--}}

@extends('landing_page.partials.master')

{{-- CSS External --}}
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css?v=2.8" rel="stylesheet"
    integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
<link rel="stylesheet" href="{{ asset('assets/css/ayat.css?v=2.8') }}">

@section('content')
    {{-- Preloader --}}
    <div class="preloader">
        <div class="preloader-inner">
            <div class="preloader-icon">
                <span></span>
                <span></span>
            </div>
        </div>
    </div>

    <div class="container d-none d-sm-block d-md-none">
        <hr>
    </div>

    {{-- ============================================================
         NAVIGASI DESKTOP (Pilih Surah & Qori)
         ============================================================ --}}
    <div class="container d-lg-flex d-md-none mt-3 mb-3">
        {{-- Dropdown Surah --}}
        <div class="btn-group m-1 d-none d-sm-block" id="DropDownSurah">
            @foreach ($surahNow as $dataNow)
                <button class="dropdown-toggle pilihSurah" data-bs-toggle="dropdown" aria-expanded="false">
                    {{ $dataNow->number_chapter }}. {{ $dataNow->name }}
                </button>
            @endforeach
            <ul class="dropdown-menu" style="overflow-y: scroll; max-height: 500px;">
                @foreach ($surahs as $surah)
                    <li>
                        <a class="dropdown-item"
                            href="{{ route('ayat', ['chapter' => $surah->number_chapter]) }}"
                            data-surah-id="{{ $surah->id }}">
                            {{ $surah->number_chapter }}. {{ $surah->name }}
                        </a>
                    </li>
                @endforeach
            </ul>
        </div>

        {{-- Dropdown Qori --}}
        <div class="btn-group m-1 d-none d-sm-block">
            <form action="{{ route('ayat', [$chapterId]) }}" method="GET" id="qoriForm" class="d-inline">
                <input type="hidden" name="verse_page" value="{{ $verse_page }}">
                <input type="hidden" name="style" value="{{ $style }}">
                <input type="hidden" name="translation" value="{{ $translationId }}">
                <input type="hidden" name="tafsir" value="{{ $tafsirId }}">
                <select class="pilihAyat" name="audio" id="audioSelect" onchange="this.form.submit()" aria-label="Pilih Qori">
                    @foreach ($recitations as $recitation)
                        <option value="{{ $recitation->id }}" @if ($recitation->id == $reciterSelected->id) selected @endif>
                            {{ $recitation->reciter_name }}@if ($recitation->style != null) ({{ $recitation->style }}) @endif
                        </option>
                    @endforeach
                </select>
            </form>
        </div>
    </div>

    {{-- ============================================================
         NAVIGASI MOBILE (Pilih Surah & Qori)
         ============================================================ --}}
    <div class="container d-lg-none mt-2">
        <div class="d-flex justify-content-start align-items-center">
            {{-- Dropdown Surah Mobile --}}
            <div class="btn-group m-1" id="DropDownSurahMobile">
                @foreach ($surahNow as $dataNow)
                    <button class="dropdown-toggle pilihSurah" data-bs-toggle="dropdown" aria-expanded="false">
                        {{ $dataNow->name }}
                    </button>
                @endforeach
                <ul class="dropdown-menu" style="overflow-y: scroll; max-height: 500px;">
                    @foreach ($surahs as $surah)
                        <li>
                            <a class="dropdown-item"
                                href="{{ route('ayat', ['chapter' => $surah->number_chapter]) }}"
                                data-surah-id="{{ $surah->id }}">
                                {{ $surah->name }}
                            </a>
                        </li>
                    @endforeach
                </ul>
            </div>

            {{-- Dropdown Qori Mobile --}}
            <div class="btn-group m-1">
                <form action="{{ route('ayat', [$chapterId]) }}" method="GET" id="qoriFormMobile" class="d-inline">
                    <input type="hidden" name="verse_page" value="{{ $verse_page }}">
                    <input type="hidden" name="style" value="{{ $style }}">
                    <input type="hidden" name="translation" value="{{ $translationId }}">
                    <input type="hidden" name="tafsir" value="{{ $tafsirId }}">
                    <select class="pilihAyat" name="audio" id="audioSelectMobile" onchange="this.form.submit()" aria-label="Pilih Qori">
                        @foreach ($recitations as $recitation)
                            <option value="{{ $recitation->id }}" @if ($recitation->id == $reciterSelected->id) selected @endif>
                                {{ $recitation->reciter_name }}@if ($recitation->style != null) ({{ $recitation->style }}) @endif
                            </option>
                        @endforeach
                    </select>
                </form>
            </div>
        </div>
        <hr>
    </div>

    {{-- ============================================================
         PENGATURAN VIDEO PER AYAT
         ============================================================ --}}
    <div class="container my-4">
        <hr>
        <div class="header-settings">
            <p class="fs-5">Video per Ayat</p>
            <div class="row align-items-end">
                <div class="col-md-3 col-6">
                    <label for="start_verse" class="form-label">Ayat Mulai</label>
                    <input type="number" class="form-control" id="start_verse"
                        min="1" max="{{ $chapter->verse_count }}" placeholder="Contoh: 1">
                </div>
                <div class="col-md-3 col-6">
                    <label for="end_verse" class="form-label">Ayat Selesai</label>
                    <input type="number" class="form-control" id="end_verse"
                        min="1" max="{{ $chapter->verse_count }}" placeholder="Contoh: 7">
                </div>
                <div class="col-md-6 col-12 mt-3 mt-md-0 d-flex align-items-end gap-2 flex-wrap">
                    <button type="button" id="showVideoButton" class="btn btn-success">
                        <i class="ri-video-line"></i> Tampilkan Video
                    </button>
                    <button type="button" id="videoSettingsButton" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#videoSettingsModal">
                        <i class="ri-settings-3-line"></i> Pengaturan Video
                    </button>
                </div>
            </div>
        </div>
    </div>

    {{-- ============================================================
         DAFTAR AYAT
         ============================================================ --}}
    <section class="team-section">
        <div class="container">
            <div class="row">
                <div id="containerAyah" class="col-12">
                    {{-- Basmalah --}}
                    <p class="text-center fs-2 mt-lg-4 mt-md-4" style="font-family: 'Scheherazade New', serif;">
                        بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                    </p>
                    <hr class="mt-4 mt-lg-5">

                    {{-- Loop setiap ayat --}}
                    @foreach ($ayat as $ayah)
                        <div id="ayat{{ $ayah->number }}" class="pt-4">
                            {{-- Teks Arab --}}
                            <p style="font-family: 'Scheherazade New', serif; line-height: 2.5" class="text-end fs-4">
                                @php $words = explode(' ', $ayah->$style); @endphp
                                @foreach ($words as $index => $word)
                                    <span class="arabic-word" id="word-{{ $ayah->number }}-{{ $index }}">{{ $word }}</span>
                                @endforeach
                                <sup>( {{ $ayah->numberArab }} )</sup>
                            </p>

                            {{-- Info Penerjemah --}}
                            <p style="font-size: 0.7rem; margin-bottom: -1px; text-align: justify">
                                Diterjemahkan Oleh : {{ $translationsSelected->author_name }} ({{ $translationsSelected->language_name }})
                            </p>

                            {{-- Terjemahan --}}
                            <p style="font-size: 0.8rem; margin-top: 5px; text-align: justify">
                                <strong>Artinya :</strong>
                                {!! $ayah->translation_text !!} <strong>({{ $ayah->number }})</strong>
                            </p>

                            {{-- Transliterasi --}}
                            <p style="font-size: 0.8rem"><i>{!! $ayah->transliteration !!}</i></p>

                            {{-- Tombol Aksi (Copy, Share, Tafsir, Play) --}}
                            <div class="d-flex justify-content-end">
                                {{-- Copy --}}
                                <button class="transparent-button" onclick="salin(this)"
                                    data-ayat="{{ $ayah->name }} {{ $ayah->number . PHP_EOL }} {{ $ayah->text_uthmani . PHP_EOL }} {{ $ayah->translation_text . PHP_EOL }}">
                                    <i class="ri-clipboard-line ri-2x" style="color: #8dc63f"></i>
                                    <small class="d-block">Copy</small>
                                </button>

                                {{-- Share --}}
                                <button type="button" class="transparent-button"
                                    onclick="shareAyat('{{ $ayah->id }}', '{{ $ayah->name }}', '{{ $ayah->number }}', @json($ayah->text_uthmani), @json($ayah->translation_text), event)">
                                    <i class="ri-share-line ri-2x" style="color: #8dc63f"></i>
                                    <small class="d-block">Share</small>
                                </button>

                                {{-- Modal Share (Fallback) --}}
                                <div class="modal fade" id="staticBackdrop{{ $ayah->id }}"
                                    data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
                                    aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h1 class="modal-title fs-5" id="staticBackdropLabel">Bagikan Qur'an</h1>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <div class="modal-body d-flex justify-content-around">
                                                <a href="https://wa.me/?text={{ urlencode(Request::fullUrl() . '#ayat' . $ayah->number) }}%0A{{ $ayah->name }} {{ $ayah->number . PHP_EOL }}%0A{{ $ayah->text_uthmani . PHP_EOL }}%0A{!! $ayah->translation_text . PHP_EOL !!}}"
                                                    target="_blank">
                                                    <i class="ri-whatsapp-fill ri-4x" style="color: #0AE77B"></i>
                                                </a>
                                                <a href="https://t.me/share/url?url={{ urlencode(Request::fullUrl() . '#ayat' . $ayah->number) }}&text={{ $ayah->name }} {{ $ayah->number . PHP_EOL }}%0A{{ $ayah->text_uthmani . PHP_EOL }}%0A{!! $ayah->translation_text . PHP_EOL !!}}"
                                                    target="_blank" rel="noopener noreferrer">
                                                    <i class="ri-telegram-fill ri-4x" style="color: #289FD7"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {{-- Tafsir --}}
                                <button onclick="modalTafsir({{ $ayah->id }})" type="button"
                                    class="transparent-button" data-bs-toggle="modal"
                                    data-bs-target="#exampleModal{{ $ayah->id }}">
                                    <i class="ri-book-open-line" style="color: #8dc63f; font-size: 2em"></i>
                                    <small class="d-block">Tafsir</small>
                                </button>

                                {{-- Modal Tafsir --}}
                                <div class="modal fade" id="exampleModal{{ $ayah->id }}" tabindex="-1"
                                    aria-labelledby="exampleModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h1 class="modal-title fs-5" id="exampleModalLabel{{ $ayah->id }}">
                                                    {{ $ayah->name_tafsir }}
                                                </h1>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <div class="modal-body">
                                                <p id="isiTafsir{{ $ayah->id }}">{!! $ayah->tafsir_text !!}</p>
                                            </div>
                                            <div class="modal-footer"></div>
                                        </div>
                                    </div>
                                </div>

                                {{-- Play Audio --}}
                                <button id="musicButton{{ $ayah->number }}" class="transparent-button"
                                    onclick="playMusic('{{ $ayah->number }}', {{ $chapterId }}, {{ $reciter_Id }})">
                                    <i class="ri-play-circle-line" style="color: #8dc63f; font-size: 2em"></i>
                                    <small class="d-block">Play</small>
                                </button>

                                {{-- Audio Element (hidden) --}}
                                <audio id="myAudio{{ $ayah->number }}" controls style="display: none">
                                    <source id="audio{{ $ayah->number }}" src="{{ url($ayah->url) }}" type="audio/mp3">
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        </div>
                        <hr>
                    @endforeach

                    {{-- Pagination --}}
                    <div class="mt-lg-5">
                        @if ($verse_page != $chapter->verse_count)
                            {{ $ayat->appends(['verse_page' => $verse_page, 'audio' => $reciter_Id, 'style' => $style, 'translation' => $translationId, 'tafsir' => $tafsirId])->links('vendor.pagination.bootstrap-5') }}
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </section>

    {{-- ============================================================
         MODAL PENGATURAN VIDEO
         ============================================================ --}}
    <div class="modal fade" id="videoSettingsModal" tabindex="-1" aria-labelledby="videoSettingsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 460px;">
            <div class="modal-content border-0 shadow-lg overflow-hidden" style="border-radius: 18px;">

                {{-- Header gradient --}}
                <div class="modal-header border-0 px-4 pt-4 pb-3"
                     style="background: linear-gradient(135deg, #182d41 0%, #2a4a2a 60%, #4a7c1f 100%);">
                    <div class="d-flex align-items-center gap-2">
                        <div style="width:38px;height:38px;border-radius:50%;background:rgba(141,198,63,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid rgba(141,198,63,0.4);">
                            <i class="ri-settings-3-line" style="color:#8DC63F;font-size:1.1rem;"></i>
                        </div>
                        <div>
                            <h6 class="modal-title fw-bold mb-0 text-white" id="videoSettingsModalLabel">Pengaturan Video</h6>
                            <small style="color:rgba(255,255,255,0.6);font-size:0.7rem;">Sesuaikan tampilan video ayat</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-4" style="background:#f5f9ee;">

                    {{-- 1. Upload Background --}}
                    <div class="mb-4">
                        <label class="form-label fw-semibold mb-2 d-flex align-items-center gap-1"
                               style="font-size:0.75rem;color:#182d41;letter-spacing:.06em;text-transform:uppercase;">
                            <i class="ri-image-add-line" style="color:#8DC63F;font-size:1rem;"></i> Latar Belakang
                        </label>
                        <div class="d-flex align-items-center gap-2 p-3 rounded-3"
                             style="background:#fff;border:1.5px dashed #b8d97a;">
                            <input type="file" id="bgImageInputModal" accept="image/*,video/mp4,video/webm,video/ogg" style="display:none;">
                            <button type="button"
                                    class="btn btn-sm fw-semibold px-3"
                                    style="background:linear-gradient(135deg,#8DC63F,#81C444);color:#fff;border:none;border-radius:8px;font-size:0.8rem;"
                                    onclick="document.getElementById('bgImageInputModal').click()">
                                <i class="ri-upload-2-line me-1"></i>Unggah File
                            </button>
                            <button type="button" id="removeBgBtn"
                                    class="btn btn-sm fw-semibold px-3"
                                    style="border:1.5px solid #ef4444;color:#ef4444;border-radius:8px;background:transparent;font-size:0.8rem;display:none;">
                                <i class="ri-delete-bin-line me-1"></i>Hapus
                            </button>
                            <span id="bgStatusBadge"
                                  class="badge rounded-pill ms-auto"
                                  style="background:#eaf4d3;color:#5a8a1a;font-size:0.7rem;padding:5px 12px;">
                                Default
                            </span>
                        </div>
                    </div>

                    {{-- 2. Warna & Opasitas --}}
                    <div class="mb-4">
                        <label class="form-label fw-semibold mb-2 d-flex align-items-center gap-1"
                               style="font-size:0.75rem;color:#182d41;letter-spacing:.06em;text-transform:uppercase;">
                            <i class="ri-palette-line" style="color:#8DC63F;font-size:1rem;"></i> Warna & Tampilan
                        </label>
                        <div class="p-3 rounded-3" style="background:#fff;border:1.5px solid #daeaa5;">
                            <div class="row g-3">
                                <div class="col-6">
                                    <label for="textColorPicker" class="form-label small text-muted mb-1">Warna Teks</label>
                                    <div class="input-group input-group-sm">
                                        <input type="color" class="form-control form-control-color p-1"
                                               id="textColorPicker" value="#ffffff"
                                               style="max-width:40px;height:34px;cursor:pointer;border-radius:8px 0 0 8px;border:1.5px solid #daeaa5;">
                                        <input type="text" class="form-control text-center font-monospace"
                                               id="textColorHex" value="#ffffff"
                                               style="font-size:0.78rem;border-radius:0 8px 8px 0;border:1.5px solid #daeaa5;">
                                    </div>
                                </div>
                                <div class="col-6">
                                    <label for="bgColorPicker" class="form-label small text-muted mb-1">Warna Latar Teks</label>
                                    <div class="input-group input-group-sm">
                                        <input type="color" class="form-control form-control-color p-1"
                                               id="bgColorPicker" value="#0033ad"
                                               style="max-width:40px;height:34px;cursor:pointer;border-radius:8px 0 0 8px;border:1.5px solid #daeaa5;">
                                        <input type="text" class="form-control text-center font-monospace"
                                               id="bgColorHex" value="#0033ad"
                                               style="font-size:0.78rem;border-radius:0 8px 8px 0;border:1.5px solid #daeaa5;">
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3 pt-3" style="border-top:1px solid #eaf4d3;">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label for="bgOpacityRange" class="small text-muted mb-0">
                                        <i class="ri-contrast-line me-1"></i>Opasitas Latar
                                    </label>
                                    <span id="bgOpacityValue"
                                          class="badge"
                                          style="background:linear-gradient(135deg,#8DC63F,#81C444);color:#fff;font-size:0.7rem;border-radius:20px;padding:4px 10px;">
                                        100%
                                    </span>
                                </div>
                                <input type="range" class="form-range" id="bgOpacityRange"
                                       min="0" max="100" value="100" step="5"
                                       style="accent-color:#8DC63F;">
                                <div class="d-flex justify-content-between" style="font-size:0.65rem;color:#94a3b8;margin-top:-2px;">
                                    <span>Transparan</span><span>Penuh</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- 3. Pratinjau --}}
                    <div>
                        <label class="form-label fw-semibold mb-2 d-flex align-items-center gap-1"
                               style="font-size:0.75rem;color:#182d41;letter-spacing:.06em;text-transform:uppercase;">
                            <i class="ri-eye-line" style="color:#8DC63F;font-size:1rem;"></i> Pratinjau Tampilan
                        </label>
                        <div id="settingsPreviewBox"
                             class="rounded-3 position-relative overflow-hidden"
                             style="background:linear-gradient(135deg,#050a05 0%,#0d1a0d 50%,#1a331a 100%);
                                    min-height:115px;display:flex;flex-direction:column;
                                    justify-content:center;align-items:center;gap:8px;padding:1.2rem 1rem;">
                            <div id="previewArabicText"
                                 style="font-family:'Scheherazade New',serif;font-size:1.35rem;
                                        color:#ffffff;background-color:#0033ad;
                                        padding:4px 14px;border-radius:6px;display:inline-block;line-height:2;">
                                بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                            </div>
                            <div id="previewTransText"
                                 style="font-size:0.78rem;color:#ffffff;background-color:#0033ad;
                                        padding:4px 12px;border-radius:6px;display:inline-block;">
                                Dengan menyebut nama Allah
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Footer --}}
                <div class="modal-footer border-0 px-4 py-3 d-flex justify-content-between"
                     style="background:#eaf4d3;">
                    <button type="button" id="resetVideoSettingsBtn"
                            class="btn btn-sm fw-semibold"
                            style="border:1.5px solid #94a3b8;color:#182d41;border-radius:8px;font-size:0.8rem;background:transparent;padding:6px 16px;">
                        <i class="ri-refresh-line me-1"></i>Reset Default
                    </button>
                    <button type="button"
                            class="btn btn-sm fw-semibold px-4"
                            style="background:linear-gradient(135deg,#8DC63F,#81C444);color:#fff;border:none;border-radius:8px;font-size:0.82rem;padding:6px 20px;"
                            data-bs-dismiss="modal">
                        <i class="ri-save-line me-1"></i>Simpan & Tutup
                    </button>
                </div>
            </div>
        </div>
    </div>

    {{-- ============================================================
         MODAL VIDEO AYAT
         ============================================================ --}}
    <div class="modal fade ayat-video-modal" id="ayatVideoModal" tabindex="-1"
        aria-labelledby="ayatVideoModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="ayatVideoModalLabel">Video Ayat</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="ayatVideoModalBody">
                    {{-- Konten video akan dimuat secara dinamis via JavaScript --}}
                </div>
            </div>
        </div>
    </div>

    {{-- Data config untuk JavaScript (menghindari inline Blade di dalam JS) --}}
    <div id="video-data-config" style="display:none;"
        data-ayat="{{ json_encode($ayat->items()) }}"
        data-style="{{ $style }}"
        data-last-verse="{{ $chapter->verse_count }}"
        data-chapter-name="{{ $chapter->name }}"
        data-chapter-id="{{ $chapterId }}"
        data-reciter-id="{{ $reciter_Id ?? 1 }}"
        data-public-origin="{{ rtrim(config('app.url') ?? env('APP_URL', ''), '/') }}">
    </div>
@endsection

@push('addon-script')
    {{-- Audio Player & Highlighting --}}
    <script src="{{ asset('assets/js/quran-audio-player.js?v=2.8') }}"></script>

    {{-- Video Recorder --}}
    <script src="{{ asset('assets/js/quran-video-recorder.js?v=3.4') }}"></script>
@endpush