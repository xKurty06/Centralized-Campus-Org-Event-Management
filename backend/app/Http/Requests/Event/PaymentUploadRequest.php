<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class PaymentUploadRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'image' => 'required|image|max:10240',
        ];
    }
}
