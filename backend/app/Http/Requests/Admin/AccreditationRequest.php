<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AccreditationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'accreditation_status' => 'required|in:Active,Suspended',
            'reason' => 'required_if:accreditation_status,Suspended|string|max:500',
        ];
    }
}
