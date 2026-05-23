<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class UserResource extends JsonResource
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

    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'email' => $this->email,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'dept_id' => $this->dept_id,
            'year_level' => $this->year_level,
            'global_role' => $this->global_role,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->normalizeDate($this->created_at),
            'updated_at' => $this->normalizeDate($this->updated_at),
        ];
    }
}
