<?php

namespace App\Http\Requests\Manage;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'venue_id' => 'nullable|integer|exists:venues,id',
            'category_id' => 'nullable|integer|exists:event_categories,id',
            'title' => 'nullable|string|max:255',
            'banner_url' => 'nullable|url|max:1000',
            'banner_file' => 'nullable|image|max:5120',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'capacity' => 'nullable|integer|min:1',
            'audience_type' => 'nullable|in:Open,CvSU_Only,Org_Members_Only',
            'is_paid' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'payment_instructions' => 'nullable|string',
            'status' => 'nullable|in:Upcoming,Open,Closed,Completed,Cancelled',
        ];
    }
}
