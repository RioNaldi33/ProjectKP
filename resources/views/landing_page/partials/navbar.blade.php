{{--
|--------------------------------------------------------------------------
| Navbar
|--------------------------------------------------------------------------
|
| Navigasi utama aplikasi: menu surah, chatbot, donasi, dan auth.
|
--}}
<header class="header-3 pattern-1 position-fixed top-0 start-0 end-0">
    <div class="container">
        <div class="row align-items-center justify-content-center">

            {{-- Logo & Mobile Menu --}}
            <div class="col-xl-2 col-12">
                <div class="mobile-menu-wrapper d-flex flex-wrap align-items-center justify-content-between">
                    <div class="header-bar d-lg-none">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div class="logo">
                        <a href="{{ route('home') }}">
                            <img src="{{ asset('assets/images/logo/l4.png') }}" alt="Logo E-Mufassir">
                        </a>
                    </div>
                    <div class="donate text-center d-lg-none">
                        <a href="{{ route('donation') }}">
                            <i class="ri-hand-heart-line"></i>
                            <small>donasi</small>
                        </a>
                    </div>
                </div>
            </div>

            {{-- Navigation Menu --}}
            <div class="col-xl-10 col-12">
                <div class="header-top">
                    <div class="header-top-area">
                        <ul class="left lab-ul mb-3">
                            <li></li>
                        </ul>
                    </div>
                </div>
                <div class="header-bottom">
                    <div class="header-wrapper">
                        <div class="menu-area justify-content-between w-10">
                            <ul class="menu lab-ul">
                                <li class="list">
                                    <a href="https://e-mufassir.com">E-Mufassir</a>
                                </li>
                                <li class="list">
                                    <a href="{{ route('home') }}">Al-Qur'an</a>
                                </li>
                                <li class="list">
                                    <a href="#0">Chatbot Al-Quran & Tafsir</a>
                                    <ul class="submenu">
                                        <li><a href="{{ route('quran-chat') }}">Chatbot Al-Quran</a></li>
                                        <li><a href="{{ route('aljalalain-chat') }}">Chatbot Tafsir Al-Jalalain</a></li>
                                        <li><a href="{{ route('ibnKatsir-chat') }}">Chatbot Ibn Katsir</a></li>
                                        <li><a href="{{ route('azhar-chat') }}">Chatbot Tafsir Al-Azhar</a></li>
                                    </ul>
                                </li>
                                <li class="list">
                                    <a href="https://t.me/quran_emufassir_bot">Chatbot Telegram</a>
                                </li>

                                {{-- Auth: Login / Logout --}}
                                @auth
                                    <li class="list">
                                        <a type="button" class="login-logout text-start"
                                            data-bs-toggle="modal" data-bs-target="#LogOut">
                                            Logout
                                        </a>
                                    </li>
                                @else
                                    <li class="list">
                                        <a class="login-logout text-start" href="{{ route('login') }}"
                                            style="font-weight: bold">Login</a>
                                    </li>
                                @endauth

                                {{-- Tombol Donasi (Desktop) --}}
                                <li class="donasi d-none d-lg-block">
                                    <button type="button" class="btn">
                                        <a href="{{ route('donation') }}" style="color: white; font-weight: bold">
                                            Donasi <i class="ri-hand-heart-fill"></i>
                                        </a>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</header>

{{-- Modal Konfirmasi Logout --}}
<div class="modal fade" id="LogOut" tabindex="-1" aria-labelledby="LogOutLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-body">
                <h6 class="font-poppins text-center">Apakah Anda Ingin Logout?</h6>
            </div>
            <div class="modal-footer justify-content-center gap-5">
                <button type="button" class="btn btn-success" data-bs-dismiss="modal">Tidak</button>
                <a href="{{ route('logout') }}" type="button" class="btn btn-danger"
                    onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                    Iya
                </a>
                <form id="logout-form" action="{{ route('logout') }}" method="POST" class="d-none">
                    @csrf
                </form>
            </div>
        </div>
    </div>
</div>
