<?php

namespace App\Http\Requests\Manage;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrgProfileRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'nullable|string|max:200',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|url|max:1000',
            'logo_file' => 'nullable|image|max:5120',
            'remove_logo' => 'nullable|boolean',
            'adviser' => 'nullable|string|max:150',
        ];
    }
}
