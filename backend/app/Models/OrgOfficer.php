<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrgOfficer extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id','org_id','user_id','role','is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
