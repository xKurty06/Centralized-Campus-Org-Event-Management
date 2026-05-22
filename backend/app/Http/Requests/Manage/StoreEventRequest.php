<?php

namespace App\Http\Requests\Manage;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'venue_id' => 'required|integer|exists:venues,id',
            'category_id' => 'required|integer|exists:event_categories,id',
            'title' => 'required|string|max:255',
            'banner_url' => 'nullable|url|max:1000',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'capacity' => 'required|integer|min:1',
            'audience_type' => 'required|in:Open,CvSU_Only,Org_Members_Only',
            'is_paid' => 'required|boolean',
            'payment_instructions' => 'nullable|string',
            'status' => 'required|in:Upcoming,Open,Full,Closed,Completed,Cancelled',
        ];
    }
}
