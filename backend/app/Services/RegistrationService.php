<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegistrationService
{
    /**
     * Register a student for an event.
     * Returns true on success, throws exception on failure.
     */
    public function register(string $eventId, string $userId, string $paymentSelection = 'N/A'): bool
    {
        DB::transaction(function () use ($eventId, $userId, $paymentSelection): void {
            $this->registerWithoutProcedure($eventId, $userId, $paymentSelection);
        });

        return true;
    }

    private function registerWithoutProcedure(string $eventId, string $userId, string $paymentSelection): void
    {
        $event = DB::table('events')->where('id', $eventId)->lockForUpdate()->first();
        if (!$event) {
            throw new \RuntimeException('Event not found.');
        }
        if (($event->status ?? null) !== 'Open') {
            throw new \RuntimeException('Event not found or not open.');
        }

        $alreadyRegistered = DB::table('registrations')
            ->where('event_id', $eventId)
            ->where('user_id', $userId)
            ->exists();
        if ($alreadyRegistered) {
            throw new \RuntimeException('You are already registered for this event.');
        }

        $capacity = (int) ($event->capacity ?? 0);
        $registeredCount = (int) DB::table('registrations')->where('event_id', $eventId)->count();
        if ($registeredCount >= $capacity) {
            throw new \RuntimeException('Event is already full.');
        }

        $user = DB::table('users')->where('id', $userId)->where('is_active', 1)->first();
        if (!$user) {
            throw new \RuntimeException('User account is inactive or unavailable.');
        }

        if (($event->audience_type ?? null) === 'CvSU_Only' && ($user->global_role ?? null) !== 'User') {
            throw new \RuntimeException('Event is limited to CvSU users only.');
        }

        if (($event->audience_type ?? null) === 'Org_Members_Only') {
            $isEligibleMember = DB::table('org_members')
                ->where('org_id', $event->host_org_id)
                ->where('user_id', $userId)
                ->whereRaw("LOWER(TRIM(membership_status)) = 'active'")
                ->where('paid_membership_fee', 1)
                ->exists()
                || DB::table('org_officers')
                    ->where('org_id', $event->host_org_id)
                    ->where('user_id', $userId)
                    ->where('is_active', 1)
                    ->exists();

            if (!$isEligibleMember) {
                throw new \RuntimeException('Only active organization members can register for this event.');
            }
        }

        $isPaid = (bool) ($event->is_paid ?? false);
        $status = $isPaid ? 'Pending' : 'Paid';
        $selection = $isPaid ? $paymentSelection : 'N/A';
        $registrationId = (string) Str::uuid();

        DB::table('registrations')->insert([
            'id' => $registrationId,
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

        if ($isPaid && $selection === 'Online') {
            DB::table('payment_proofs')->insert([
                'id' => (string) Str::uuid(),
                'reg_id' => $registrationId,
                'image_url' => null,
                'uploaded_at' => now(),
                'status' => 'Pending_Review',
                'verified_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => 'Registration_Confirm',
            'reference_id' => $registrationId,
            'message' => 'Your registration has been received.',
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
