<?php

namespace App\Models\EMufassir;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Activity extends Model
{
    use HasFactory;

    protected $connection = "secondmysql";

    protected $fillable = [
        'question',
        'answer',
        'category',
        'user_id'
    ];

    public function user() : BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
