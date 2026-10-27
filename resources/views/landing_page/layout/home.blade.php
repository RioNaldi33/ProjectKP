{{--
|--------------------------------------------------------------------------
| Halaman Utama - Daftar Surah Al-Qur'an
|--------------------------------------------------------------------------
|
| Menampilkan carousel banner dan grid daftar 114 surah.
|
--}}

@extends('landing_page.partials.master')

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css?v=2.8" rel="stylesheet"
    integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">

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

    {{-- ============================================================
         BANNER CAROUSEL
         ============================================================ --}}
    <section class="banner w-100 overflow-hidden">
        <div class="content-top">
            <div class="row justify-content-center">
                <div class="col-lg-10 col-md-11 col-11">
                    <div id="carouselExampleAutoplaying" class="carousel slide" data-bs-ride="carousel">
                        <div class="carousel-inner rounded-5">
                            <div class="carousel-item active">
                                <img src="{{ asset('assets/images/carousel/image5.png') }}" class="d-block img-fluid" alt="Banner 1">
                            </div>
                            <div class="carousel-item">
                                <img src="{{ asset('assets/images/carousel/image2.png') }}" class="d-block img-fluid" alt="Banner 2">
                            </div>
                            <div class="carousel-item">
                                <img src="{{ asset('assets/images/carousel/image4.png') }}" class="d-block img-fluid" alt="Banner 3">
                            </div>
                            <div class="carousel-item">
                                <img src="{{ asset('assets/images/carousel/image6.png') }}" class="d-block img-fluid" alt="Banner 4">
                            </div>
                            <div class="carousel-item">
                                <img src="{{ asset('assets/images/carousel/image1.png') }}" class="d-block img-fluid" alt="Banner 5">
                            </div>
                            <div class="carousel-item">
                                <img src="{{ asset('assets/images/carousel/image3.png') }}" class="d-block img-fluid" alt="Banner 6">
                            </div>
                        </div>
                        <button class="carousel-control-prev" type="button"
                            data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Previous</span>
                        </button>
                        <button class="carousel-control-next" type="button"
                            data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Next</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {{-- ============================================================
         DAFTAR SURAH AL-QUR'AN
         ============================================================ --}}
    <section class="team-section mt-4">
        <div id="Quran" class="container">
            <div class="row">
                <div class="col-12">
                    <div class="header-title mb-4">
                        <h2>AL-QUR'AN</h2>
                    </div>
                </div>
                <div class="col-12">
                    <div class="row row-cols-2 row-cols-md-3 g-lg-4 g-1">
                        @foreach ($chapter as $data)
                            <a href="{{ route('ayat', ['chapter' => $data->number_chapter]) }}">
                                <div class="col justify-content-center">
                                    <div class="card-quran text-center border-dark team-item-1 rounded-3 shadow">
                                        <div class="d-flex py-4 align-items-center justify-content-around p-4">
                                            <div class="d-flex">
                                                <h2 class="card-title-quran">{{ $data->number_chapter }}</h2>
                                            </div>
                                            <div class="d-flex flex-column">
                                                <h3>{{ $data->arabic_name }}</h3>
                                                <p>{{ $data->name }}</p>
                                                <p><small>{{ $data->translate_text }}</small></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </section>
@endsection
