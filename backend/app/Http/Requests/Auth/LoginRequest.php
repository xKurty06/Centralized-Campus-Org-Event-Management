<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'school_id' => 'required_without:email|string|max:20',
            'email' => 'required_without:school_id|email|max:150',
            'password' => 'required|string',
        ];
    }
}
