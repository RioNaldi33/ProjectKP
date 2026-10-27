<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\DonationController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Definisi route utama aplikasi Qur'an E-Mufassir.
| Semua route menggunakan middleware group "web".
|
*/

// =====================================================
//  HALAMAN PUBLIK
// =====================================================
Route::get('/', [ChapterController::class, 'index'])->name('home');
Route::get('/surah/{chapter}', [ChapterController::class, 'show'])->name('ayat');

// =====================================================
//  HALAMAN DONASI
// =====================================================
Route::get('/donation', [DonationController::class, 'index'])->name('donation');
Route::post('/add-donation', [DonationController::class, 'store'])->name('add-donation');

// =====================================================
//  CHATBOT (Memerlukan Login)
// =====================================================
Route::group(['middleware' => ['auth', 'user']], function () {
    Route::get('/chatbot-quran', [ChatbotController::class, 'indexQuranChatbot'])->name('quran-chat');
    Route::get('/chatbot-azhar', [ChatbotController::class, 'indexAzharChatbot'])->name('azhar-chat');
    Route::get('/chatbot-aljalalain', [ChatbotController::class, 'indexAljalalainChatbot'])->name('aljalalain-chat');
    Route::get('/chatbot-ibnKatsir', [ChatbotController::class, 'indexIbnKatsirChatbot'])->name('ibnKatsir-chat');
});

// =====================================================
//  AUTH (Login, Register, dll.)
// =====================================================
Auth::routes();
