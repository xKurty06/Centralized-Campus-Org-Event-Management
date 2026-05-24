<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class EventResource extends JsonResource
{
    private function normalizeDate($value): ?string
    {
        if (!$value) return null;
        if ($value instanceof \DateTimeInterface) return $value->format(DATE_ATOM);

        try {
            return Carbon::parse((string) $value)->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }

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
            'venue_name' => $this->venue_name ?? null,
            'category_id' => $this->category_id,
            'category_name' => $this->category_name ?? null,
            'status' => $this->status ?? null,
            'total_registered' => isset($this->total_registered) ? (int) $this->total_registered : 0,
            'total_paid' => isset($this->total_paid) ? (int) $this->total_paid : 0,
            'total_pending' => isset($this->total_pending) ? (int) $this->total_pending : 0,
            'proofs_pending_review' => isset($this->proofs_pending_review) ? (int) $this->proofs_pending_review : 0,
            'created_at' => $this->normalizeDate($this->created_at),
            'updated_at' => $this->normalizeDate($this->updated_at),
        ];
    }
}
