@extends('landing_page.partials.master')

@section('content')
    <!-- Registration section start Here -->
    <div class="container">
        <div class="d-flex justify-content-around align-items-center gap-5 register-page">
            <div>
                <div class="m-5">
                    <p class="font-costum">
                        Selamat Datang Di Quran E-Mufassir, Temukan Pengalaman yang luar biasa dengan berbagai fitur yang kami
                        tawarkan...
                    </p>
                    <h2 class="font-poppins mb-4">Bergabunglah dengan Kami <i class="ri-arrow-down-circle-line"></i></h2>
                    <a class="btn-reg" href="http://admin.e-mufassir.com/register">Daftar Di Sini</a>
                </div>
            </div>
            <div>
                <img style="border-radius: 14px" src="{{ url('assets/images/gallery/registration.jpg') }}" alt="registration"
                     width="900">
            </div>
        </div>
    </div>
    <!-- Registration section end Here -->
@endsection
