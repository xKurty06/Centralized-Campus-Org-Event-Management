<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentProof extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id','reg_id','image_url','uploaded_at','status','verified_by'];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class, 'reg_id');
    }
}
