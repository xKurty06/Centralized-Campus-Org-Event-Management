<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'start_date' => $this->start_date ? (string) $this->start_date : null,
            'end_date' => $this->end_date ? (string) $this->end_date : null,
            'capacity' => (int) $this->capacity,
            'audience_type' => $this->audience_type,
            'is_paid' => (bool) $this->is_paid,
            'host_org_id' => $this->host_org_id,
            'venue_id' => $this->venue_id,
            'category_id' => $this->category_id,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
