<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'id',
        'school_id',
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'dept_id',
        'course_id',
        'year_level',
        'section',
        'global_role',
        'is_active'
    ];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'is_active' => 'boolean',
        'year_level' => 'integer',
    ];

    public $incrementing = false;
    protected $keyType = 'string';
}
