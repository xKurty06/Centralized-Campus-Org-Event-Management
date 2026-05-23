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
            'name' => $this->name,
            'category_id' => $this->category_id,
            'description' => $this->description,
            'logo_url' => $this->logo_url,
            'adviser' => $this->adviser,
            'is_accredited' => (bool) ($this->is_accredited ?? false),
            'created_at' => $this->iso8601OrNull($this->created_at),
            'updated_at' => $this->iso8601OrNull($this->updated_at),
        ];
    }
}
