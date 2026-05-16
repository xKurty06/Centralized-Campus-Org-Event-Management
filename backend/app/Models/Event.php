<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id','title','description','start_date','end_date','venue_id','category_id','capacity','audience_type','is_paid','host_org_id','status','banner_url','payment_instructions'
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_paid' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'host_org_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'event_id');
    }
}
