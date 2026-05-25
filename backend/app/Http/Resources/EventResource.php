<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class EventResource extends JsonResource
{
    private function normalizeUrl($value): ?string
    {
        if (!$value) return null;
        $url = trim((string) $value);
        if ($url === '') return null;
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://') || str_starts_with($url, '//')) {
            return $url;
        }
        return url($url);
    }

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
            'banner_url' => $this->normalizeUrl($this->banner_url ?? null),
            'start_date' => $this->start_date ? (string) $this->start_date : null,
            'end_date' => $this->end_date ? (string) $this->end_date : null,
            'capacity' => (int) $this->capacity,
            'audience_type' => $this->audience_type,
            'is_member' => isset($this->is_member) ? (bool) $this->is_member : null,
            'is_registered' => isset($this->is_registered) ? (bool) $this->is_registered : null,
            'is_paid' => (bool) $this->is_paid,
            'fee_amount' => isset($this->fee_amount) ? (float) $this->fee_amount : null,
            'payment_instructions' => $this->payment_instructions ?? null,
            'host_org_id' => $this->host_org_id,
            'organization_name' => $this->organization_name ?? null,
            'organization_category' => $this->organization_category ?? null,
            'adviser' => $this->adviser ?? null,
            'org_members_count' => isset($this->org_members_count) ? (int) $this->org_members_count : 0,
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
