<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;

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
        } catch (QueryException $e) {
            // MySQL error 1305: stored procedure does not exist.
            // Fallback to app-level registration logic so local/dev works without SP.
            $sqlState = $e->errorInfo[0] ?? null;
            $mysqlCode = (int) ($e->errorInfo[1] ?? 0);
            if (!($sqlState === '42000' && $mysqlCode === 1305)) {
                DB::rollBack();
                throw $e;
            }

            try {
                $this->registerWithoutProcedure($eventId, $userId, $paymentSelection);
                DB::commit();
                return true;
            } catch (\Exception $inner) {
                DB::rollBack();
                throw $inner;
            }
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function registerWithoutProcedure(string $eventId, string $userId, string $paymentSelection): void
    {
        $event = DB::table('events')->where('id', $eventId)->lockForUpdate()->first();
        if (!$event) {
            throw new \RuntimeException('Event not found.');
        }

        $alreadyRegistered = DB::table('registrations')
            ->where('event_id', $eventId)
            ->where('user_id', $userId)
            ->exists();
        if ($alreadyRegistered) {
            throw new \RuntimeException('You are already registered for this event.');
        }

        $capacity = (int) ($event->capacity ?? 0);
        if ($capacity > 0) {
            $registeredCount = (int) DB::table('registrations')->where('event_id', $eventId)->count();
            if ($registeredCount >= $capacity) {
                throw new \RuntimeException('Event is already full.');
            }
        }

        $isPaid = (bool) ($event->is_paid ?? false);
        $status = $isPaid ? 'Pending' : 'Paid';
        $selection = $isPaid ? $paymentSelection : 'N/A';

        DB::table('registrations')->insert([
            'id' => (string) Str::uuid(),
            'event_id' => $eventId,
            'user_id' => $userId,
            'reg_date' => now(),
            'payment_selection' => $selection,
            'payment_status' => $status,
            'attendance_status' => 'Not_Arrived',
            'check_in_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
