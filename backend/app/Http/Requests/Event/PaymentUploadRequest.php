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
            'image' => 'required|file|mimes:jpg,jpeg,png,webp,heic,heif|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'Please upload a payment screenshot.',
            'image.file' => 'Uploaded payment proof is invalid.',
            'image.mimes' => 'Only JPG, JPEG, PNG, WEBP, HEIC, and HEIF images are allowed.',
            'image.max' => 'Image must be 5MB or smaller.',
        ];
    }
}
