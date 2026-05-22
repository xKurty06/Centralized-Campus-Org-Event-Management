<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venue extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id','name','location','capacity'];

    protected $casts = [
        'capacity' => 'integer',
    ];
}
