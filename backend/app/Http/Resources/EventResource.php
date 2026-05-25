<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class EventResource extends JsonResource
{
    private function parseEventDate($value): ?Carbon
    {
        if (!$value) return null;
        try {
            return Carbon::parse((string) $value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function effectiveStatus(?string $rawStatus, ?Carbon $startAt, ?Carbon $endAt): ?string
    {
        $status = is_string($rawStatus) ? trim($rawStatus) : null;
        if (!$status) return null;

        if ($status === 'Cancelled' || $status === 'Completed') {
            return $status;
        }

        $now = now();
        $eventEnd = $endAt ?? $startAt;
        if ($eventEnd && $eventEnd->lt($now)) {
            return 'Completed';
        }

        return $status;
    }

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
        $startAt = $this->parseEventDate($this->start_date ?? null);
        $endAt = $this->parseEventDate($this->end_date ?? null) ?? $startAt;
        $rawStatus = $this->status ?? null;
        $effectiveStatus = $this->effectiveStatus($rawStatus, $startAt, $endAt);
        $isActive = in_array($effectiveStatus, ['Open', 'Upcoming'], true);

        return [
            'id' => $this->id,
            'slug' => $this->slug ?? null,
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
            'organization_slug' => $this->organization_slug ?? null,
            'organization_name' => $this->organization_name ?? null,
            'host_org_code' => $this->host_org_code ?? null,
            'organization_category' => $this->organization_category ?? null,
            'adviser' => $this->adviser ?? null,
            'org_members_count' => isset($this->org_members_count) ? (int) $this->org_members_count : 0,
            'venue_id' => $this->venue_id,
            'venue_name' => $this->venue_name ?? null,
            'category_id' => $this->category_id,
            'category_name' => $this->category_name ?? null,
            'status' => $rawStatus,
            'effective_status' => $effectiveStatus,
            'is_active' => $isActive,
            'is_past' => $endAt ? $endAt->lt(now()) : null,
            'total_registered' => isset($this->total_registered) ? (int) $this->total_registered : 0,
            'total_paid' => isset($this->total_paid) ? (int) $this->total_paid : 0,
            'total_pending' => isset($this->total_pending) ? (int) $this->total_pending : 0,
            'proofs_pending_review' => isset($this->proofs_pending_review) ? (int) $this->proofs_pending_review : 0,
            'created_at' => $this->normalizeDate($this->created_at),
            'updated_at' => $this->normalizeDate($this->updated_at),
        ];
    }
}
