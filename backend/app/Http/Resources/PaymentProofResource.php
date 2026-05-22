<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentProofResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'reg_id' => $this->reg_id,
            'image_url' => $this->image_url,
            'uploaded_at' => $this->uploaded_at ? (string) $this->uploaded_at : null,
            'status' => $this->status,
            'verified_by' => $this->verified_by,
        ];
    }
}
