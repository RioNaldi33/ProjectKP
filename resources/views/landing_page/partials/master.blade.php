{{--
|--------------------------------------------------------------------------
| Master Layout
|--------------------------------------------------------------------------
|
| Template utama aplikasi. Semua halaman meng-extend layout ini.
| Struktur: Head → Navbar → Content → Scripts
|
--}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
@include('landing_page.partials.head')

<body class="w-100 overflow-x-hidden">
    @include('landing_page.partials.navbar')

    {{-- Main Content Area --}}
    <div class="mt-5 pt-5">
        <div class="pt-lg-5">
            <div class="pt-md-2">
                @yield('content')
            </div>
        </div>
    </div>

    {{-- Scroll to Top Button --}}
    <div class="container">
        <a href="#" class="scrollToTop">
            <i class="ri-arrow-up-line"></i>
            <span class="pluse_1"></span>
            <span class="pluse_2"></span>
        </a>
    </div>

    {{-- Scripts --}}
    @include('landing_page.partials.script')
    @stack('addon-script')
</body>
</html>
