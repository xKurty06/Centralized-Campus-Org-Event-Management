<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrgOfficerResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'user_id' => $this->user_id,
            'user_name' => trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')) ?: null,
            'user_school_id' => $this->school_id ?? null,
            'user_email' => $this->email ?? null,
            'position' => $this->position ?? null,
            'role' => $this->position ?? null,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at ?? null,
            'updated_at' => $this->updated_at ?? null,
        ];
    }
}
