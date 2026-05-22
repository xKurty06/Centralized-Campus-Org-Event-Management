<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Insert a notification record.
     */
    public function notify(string $userId, string $type, string $referenceId, string $message): void
    {
        DB::table('notifications')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $userId,
            'type' => $type,
            'reference_id' => $referenceId,
            'message' => $message,
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
