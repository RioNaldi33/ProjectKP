<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
@include('landing_page.partials.head')

<body class="w-100 overflow-x-hidden" style="min-height: 100vh; position: relative;">
    @yield('content')
    <div class="container">
        <a href="#" class="scrollToTop">
            <i class="ri-arrow-up-line"></i>
            <span class="pluse_1"></span>
            <span class="pluse_2"></span>
        </a>
    </div>
    @include('landing_page.partials.script')
    @stack('addon-script')
</body>

</html>
