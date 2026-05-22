<?php

namespace App\Http\Requests\Manage;

use Illuminate\Foundation\Http\FormRequest;

class SyncRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|string',
            'items.*.reg_id' => 'required|string',
            'items.*.action_type' => 'required|in:Verify_Payment,Check_In',
            'items.*.device_timestamp' => 'required|date',
        ];
    }
}
