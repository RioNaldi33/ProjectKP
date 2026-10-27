<?php

namespace App\Http\Controllers;

/**
 * ChatbotController
 *
 * Mengelola halaman chatbot Al-Qur'an dan Tafsir.
 * Setiap chatbot memiliki view tersendiri berdasarkan sumber tafsir.
 */
class ChatbotController extends Controller
{
    /**
     * Halaman Chatbot Al-Qur'an.
     *
     * @return \Illuminate\View\View
     */
    public function indexQuranChatbot()
    {
        return view('landing_page.layout.chatbot.quranChatbot');
    }

    /**
     * Halaman Chatbot Tafsir Al-Azhar.
     *
     * @return \Illuminate\View\View
     */
    public function indexAzharChatbot()
    {
        return view('landing_page.layout.chatbot.tafsirAlAzhar');
    }

    /**
     * Halaman Chatbot Tafsir Al-Jalalain.
     *
     * @return \Illuminate\View\View
     */
    public function indexAljalalainChatbot()
    {
        return view('landing_page.layout.chatbot.tafsirAlJalalain');
    }

    /**
     * Halaman Chatbot Tafsir Ibn Katsir.
     *
     * @return \Illuminate\View\View
     */
    public function indexIbnKatsirChatbot()
    {
        return view('landing_page.layout.chatbot.tafsirIbnKatsir');
    }
}
