<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrgRequest extends FormRequest
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
            'adviser' => 'nullable|string|max:150',
            'category_id' => 'nullable|integer|exists:org_categories,id',
        ];
    }
}
