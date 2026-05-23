<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrgRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:200|unique:organizations,name',
            'code_name' => 'required|string|max:50|unique:organizations,code_name',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|url|max:1000',
            'adviser' => 'nullable|string|max:150',
            'founded_date' => 'nullable|date',
            'category_id' => 'required|integer|exists:org_categories,id',
            'accreditation_status' => 'nullable|in:Active,Suspended',
        ];
    }
}
