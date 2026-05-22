<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id','user_id','type','reference_id','message','sent_at','is_read'];

    protected $casts = [
        'sent_at' => 'datetime',
        'is_read' => 'boolean',
    ];
}
