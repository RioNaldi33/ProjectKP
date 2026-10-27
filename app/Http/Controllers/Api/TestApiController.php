<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EMufassir\Activity;
use App\Models\EMufassir\Donation;
use Illuminate\Http\Request;

class TestApiController extends Controller
{
    //
    public function store(Request $request)
    {
        $question = $request->question;
        $answer = $request->answer;
        $category = "Quran";
        $user_id = 1;

        Activity::create([
            'question' => $question,
            'answer' => $answer,
            'category' => $category,
            'user_id' => $user_id
        ]);
        $data = [
            'message' => 'success'
        ];
        return response()->json($data);
    }
}
