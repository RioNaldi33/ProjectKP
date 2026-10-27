{{--
|--------------------------------------------------------------------------
| Head Partial
|--------------------------------------------------------------------------
|
| Meta tags, CSS, fonts, dan SEO tags.
|
--}}
<head>
    <title>Qur'an E-Mufassir</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    {{-- Favicon --}}
    <link rel="shortcut icon" type="image/x-icon" href="{{ asset('assets/images/x-icon/07.png') }}">

    {{-- Stylesheets --}}
    <link rel="stylesheet" href="{{ asset('assets/css/all.min.css?v=2.8') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/bootstrap.min.css?v=2.8') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/icofont.min.css?v=2.8') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/lightcase.css?v=2.8') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/css/swiper.min.css?v=2.8') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/style.css?v=2.8') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/ownStyle.css?v=2.8') }}">

    {{-- Google Fonts --}}
    <link href="https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap" rel="stylesheet">

    {{-- Remix Icon --}}
    <link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet">

    {{-- SEO & Open Graph Meta Tags --}}
    @php
        $metaTitle       = $meta_title ?? "Qur'an E-Mufassir";
        $metaDescription = $meta_description ?? "Platform belajar dan membaca Al-Qur'an dengan tafsir dan audio.";
        $metaImage       = $meta_image ?? asset('assets/images/banner/kaligrafi.jpg');
        $metaUrl         = url()->current();
    @endphp

    <meta name="description" content="{{ $metaDescription }}">

    {{-- Open Graph / Facebook --}}
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ $metaUrl }}">
    <meta property="og:title" content="{{ $metaTitle }}">
    <meta property="og:description" content="{{ $metaDescription }}">
    <meta property="og:image" content="{{ $metaImage }}">

    {{-- Twitter Card --}}
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ $metaUrl }}">
    <meta property="twitter:title" content="{{ $metaTitle }}">
    <meta property="twitter:description" content="{{ $metaDescription }}">
    <meta property="twitter:image" content="{{ $metaImage }}">
</head>
