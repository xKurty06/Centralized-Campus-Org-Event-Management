<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registration extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id','event_id','user_id','reg_date','payment_selection','payment_status','attendance_status','check_in_at'];

    protected $casts = [
        'reg_date' => 'datetime',
        'check_in_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
