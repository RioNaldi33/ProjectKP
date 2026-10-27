<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChapterController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Route API untuk aplikasi Qur'an E-Mufassir.
| Semua route menggunakan middleware group "api".
|
*/

// =====================================================
//  AUTENTIKASI API
// =====================================================
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// =====================================================
//  ENDPOINT PUBLIK
// =====================================================
Route::get('/tafsir/{id_tafsir}/{id_verse}', [ChapterController::class, 'getVerseTafsir']);
Route::get('/surah/{chapter}/ranged-verses', [ChapterController::class, 'getRangedVerses'])->name('api.ranged-verses');