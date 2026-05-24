<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class RegistrationResource extends JsonResource
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
            'full_name' => trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')),
        ];
    }
}
