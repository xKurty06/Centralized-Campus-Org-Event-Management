<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class RegistrationService
{
    /**
     * Call the stored procedure to register a student for an event.
     * Returns true on success, throws exception on failure.
     */
    public function register(string $eventId, string $userId, string $paymentSelection = 'N/A'): bool
    {
        DB::beginTransaction();
        try {
            DB::select('CALL register_student_for_event(?, ?, ?)', [$eventId, $userId, $paymentSelection]);
            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
