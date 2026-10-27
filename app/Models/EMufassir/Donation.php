<?php

namespace App\Models\EMufassir;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    use HasFactory;

    //Akses Second DB di config/database.php
    protected $connection = "secondmysql";
    protected $fillable = [
        'name',
        'account_name',
        'nominal',
        'photo'
    ];

    public function getCreatedAtAttribute($value): ?string
    {
        return Carbon::parse($value)->diffForHumans();
    }
}
