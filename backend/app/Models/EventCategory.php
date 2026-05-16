<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventCategory extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id','name'];
}
