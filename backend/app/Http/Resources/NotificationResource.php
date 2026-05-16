<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'reference_id' => $this->reference_id,
            'message' => $this->message,
            'sent_at' => $this->sent_at ? (string) $this->sent_at : null,
            'is_read' => (bool) ($this->is_read ?? 0),
        ];
    }
}
