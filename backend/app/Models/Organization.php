<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id','name','category_id','description','logo_url','adviser','is_accredited'
    ];

    protected $casts = [
        'is_accredited' => 'boolean',
    ];

    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'host_org_id');
    }
}
