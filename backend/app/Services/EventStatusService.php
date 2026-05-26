<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class EventStatusService
{
    private const PH_TIMEZONE = 'Asia/Manila';

    public function markEndedEventsCompleted(?string $eventId = null, ?string $orgId = null): int
    {
        $nowPh = Carbon::now(self::PH_TIMEZONE)->format('Y-m-d H:i:s');

        $query = DB::table('events')
            ->whereNotIn('status', ['Cancelled', 'Completed', 'Closed'])
            ->whereNotNull('end_date')
            ->where('end_date', '<', $nowPh);

        if ($eventId !== null) {
            $query->where('id', $eventId);
        }

        if ($orgId !== null) {
            $query->where('host_org_id', $orgId);
        }

        return $query->update([
            'status' => 'Completed',
            'updated_at' => now(),
        ]);
    }
}
