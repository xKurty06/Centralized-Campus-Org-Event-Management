<?php

namespace App\Http\Resources;

use Carbon\CarbonInterface;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    private function iso8601OrNull(mixed $value): ?string
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->toIso8601String();
        }

        try {
            return now()->parse((string) $value)->toIso8601String();
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug ?? null,
            'name' => $this->name,
            'code_name' => $this->code_name ?? null,
            'category_id' => $this->category_id,
            'category_name' => $this->category_name ?? null,
            'accredited_by_name' => $this->accredited_by_name ?? null,
            'description' => $this->description,
            'logo_url' => $this->logo_url,
            'adviser' => $this->adviser,
            'founded_date' => $this->founded_date ?? null,
            'members_count' => isset($this->members_count) ? (int) $this->members_count : 0,
            'events_this_year' => isset($this->events_this_year) ? (int) $this->events_this_year : 0,
            'total_events' => isset($this->total_events) ? (int) $this->total_events : 0,
            'accreditation_status' => $this->accreditation_status,
            'is_accredited' => (bool) ($this->is_accredited ?? false),
            'created_at' => $this->iso8601OrNull($this->created_at),
            'updated_at' => $this->iso8601OrNull($this->updated_at),
        ];
    }
}
