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
            'position' => $this->position ?? null,
            'role' => $this->position ?? null,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
