<?php

namespace App\Http\Requests\Manage;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

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
            'banner_file' => 'nullable|image|max:5120',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'capacity' => 'required|integer|min:1',
            'audience_type' => 'required|in:Open,CvSU_Only,Org_Members_Only',
            'is_paid' => 'required|boolean',
            'price' => 'nullable|numeric|min:0',
            'payment_instructions' => 'nullable|string',
            'status' => 'required|in:Upcoming,Open,Full,Closed,Completed,Cancelled',
        ];
    }

    protected function prepareForValidation(): void
    {
        $venueId = $this->input('venue_id');
        if (is_string($venueId) && preg_match('/^v(\d+)$/i', $venueId, $m)) {
            $venueId = (int) $m[1];
        }

        $categoryId = $this->input('category_id');
        if (!$categoryId && is_string($this->input('category'))) {
            $catName = trim($this->input('category'));
            $mapped = DB::table('event_categories')->where('name', $catName)->value('id');
            if ($mapped) {
                $categoryId = (int) $mapped;
            }
        }

        $status = $this->input('status') ?: 'Upcoming';
        $isPaid = filter_var($this->input('is_paid'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($isPaid === null) $isPaid = false;

        $price = $this->input('price');
        if (is_numeric($price)) {
            $price = (float) $price;
        } else {
            $price = null;
        }

        $this->merge([
            'venue_id' => is_numeric($venueId) ? (int) $venueId : $venueId,
            'category_id' => is_numeric($categoryId) ? (int) $categoryId : $categoryId,
            'status' => $status,
            'is_paid' => $isPaid,
            'price' => $price,
        ]);
    }
}
