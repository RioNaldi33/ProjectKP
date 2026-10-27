<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EMufassir\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class BotController extends Controller
{
    public function storeQa(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required',
            'answer' => 'required',
            'category' => 'required',
            'user_id' => 'required'
        ]);

        if ($validator->fails()) {
            $error = $validator->errors();
            $data = [
                'message' => $error,
                'error' => true
            ];
            return response()->json($data);
        }

        $validateData = $request->all();
        Activity::create([
            'question' => $validateData['question'],
            'answer' => $validateData['answer'],
            'category' => $validateData['category'],
            'user_id' => $validateData['user_id']
        ]);

        $data = [
            'message' => 'berhasil menambahkan data data',
            'error' => false
        ];

        return response()->json($data);
    }
}
