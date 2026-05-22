<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'school_id' => 'required|string|max:20|unique:users,school_id',
            'email' => ['required','email','max:150','unique:users,email','regex:/^[^@\\s]+@cvsu\.edu\.ph$/i'],
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'dept_id' => 'required|integer|exists:departments,id',
            'year_level' => 'required|integer|min:1|max:5',
        ];
    }
}
