<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class RegistrationResource extends JsonResource
{
    private function get(string $key): mixed
    {
        if (is_array($this->resource)) {
            return $this->resource[$key] ?? null;
        }

        if (is_object($this->resource) && property_exists($this->resource, $key)) {
            return $this->resource->{$key};
        }

        return null;
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
            'event_id' => $this->event_id,
            'user_id' => $this->user_id,
            'reg_date' => $this->reg_date ? (string) $this->reg_date : null,
            'payment_selection' => $this->payment_selection,
            'payment_status' => $this->payment_status,
            'attendance_status' => $this->attendance_status,
            'check_in_at' => $this->check_in_at ? (string) $this->check_in_at : null,
            'created_at' => $this->normalizeDate($this->created_at),
            'updated_at' => $this->normalizeDate($this->updated_at),
            'school_id' => $this->school_id ?? null,
            'first_name' => $this->first_name ?? null,
            'last_name' => $this->last_name ?? null,
            'proof_status' => $this->proof_status ?? null,
            'proof_image_url' => $this->proof_image_url ?? null,
            'proof_uploaded_at' => $this->get('proof_uploaded_at') ? (string) $this->get('proof_uploaded_at') : null,
            'dept_code' => $this->dept_code ?? null,
            'year_level' => isset($this->year_level) ? (int) $this->year_level : null,
            'full_name' => trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')),
            'event_title' => $this->get('event_title'),
            'event_status' => $this->get('event_status'),
            'event_start_date' => $this->get('event_start_date') ? (string) $this->get('event_start_date') : null,
            'event_end_date' => $this->get('event_end_date') ? (string) $this->get('event_end_date') : null,
            'event_is_paid' => $this->get('event_is_paid') !== null ? (bool) $this->get('event_is_paid') : null,
            'event_fee_amount' => $this->get('event_fee_amount') !== null ? (float) $this->get('event_fee_amount') : null,
            'event_banner_url' => $this->get('event_banner_url'),
            'venue_name' => $this->get('venue_name'),
            'category_name' => $this->get('category_name'),
            'org_name' => $this->get('org_name'),
        ];
    }
}
