<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
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
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
