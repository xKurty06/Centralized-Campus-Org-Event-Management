<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Manage\StoreEventRequest;
use App\Http\Requests\Manage\UpdateEventRequest;
use App\Http\Requests\Manage\UpdateOrgProfileRequest;
use App\Http\Requests\Manage\VerifySearchRequest;
use App\Http\Requests\Manage\SyncRequest;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\OrgOfficerResource;
use App\Http\Resources\RegistrationResource;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManageController extends Controller
{
    /**
     * Resolve the active officer row for the authenticated user.
     * Returns null if the user is not an active officer.
     */
    private function resolveOfficer(Request $req): ?object
    {
        return DB::table('org_officers')
            ->where('user_id', $req->user()->id)
            ->where('is_active', 1)
            ->first();
    }

    /**
     * Ensure officer can act on the given event id.
     */
    private function resolveOfficerEvent(Request $req, string $eventId): ?object
    {
        $orgRow = $this->resolveOfficer($req);
        if (!$orgRow) {
            return null;
        }

        $event = DB::table('events')
            ->where('id', $eventId)
            ->where('host_org_id', $orgRow->org_id)
            ->first();

        return $event ? (object) ['org' => $orgRow, 'event' => $event] : null;
    }

    public function dashboard(Request $req)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $perPage = (int) $req->query('per_page', 15);
            $events = DB::table('events')
                ->where('host_org_id', $orgRow->org_id)
                ->latest()
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data'    => EventResource::collection($events),
                'meta'    => [
                    'total'        => $events->total(),
                    'per_page'     => $events->perPage(),
                    'current_page' => $events->currentPage(),
                    'last_page'    => $events->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function orgProfile(Request $req)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Org not found.'], 404);
            }

            $org      = DB::table('organizations')->where('id', $orgRow->org_id)->first();
            $officers = DB::table('org_officers')->where('org_id', $org->id)->get();

            return response()->json([
                'success' => true,
                'data'    => [
                    'org'      => new OrganizationResource($org),
                    'officers' => OrgOfficerResource::collection($officers),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function updateOrgProfile(UpdateOrgProfileRequest $req)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Org not found.'], 404);
            }

            $data = $req->only(['name', 'description', 'logo_url', 'adviser']);
            DB::table('organizations')
                ->where('id', $orgRow->org_id)
                ->update(array_merge($data, ['updated_at' => now()]));

            $org = DB::table('organizations')->where('id', $orgRow->org_id)->first();

            return response()->json(['success' => true, 'data' => new OrganizationResource($org)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function createEvent(StoreEventRequest $req)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $id      = (string) Str::uuid();
            $payload = array_merge(
                $req->only([
                    'venue_id', 'category_id', 'title', 'banner_url', 'description',
                    'start_date', 'end_date', 'capacity', 'audience_type',
                    'is_paid', 'payment_instructions', 'status',
                ]),
                [
                    'id'          => $id,
                    'host_org_id' => $orgRow->org_id,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );

            DB::table('events')->insert($payload);
            $event = DB::table('events')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new EventResource($event)], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function updateEvent(UpdateEventRequest $req, string $id)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $event = DB::table('events')->where('id', $id)->first();
            if (!$event) {
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }
            if ($event->host_org_id !== $orgRow->org_id) {
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            $data = $req->only([
                'venue_id', 'category_id', 'title', 'banner_url', 'description',
                'start_date', 'end_date', 'capacity', 'audience_type',
                'is_paid', 'payment_instructions', 'status',
            ]);

            DB::table('events')
                ->where('id', $id)
                ->update(array_merge($data, ['updated_at' => now()]));

            $updated = DB::table('events')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new EventResource($updated)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function deleteEvent(Request $req, string $id)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $event = DB::table('events')->where('id', $id)->first();
            if (!$event) {
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }
            if ($event->host_org_id !== $orgRow->org_id) {
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            DB::table('events')->where('id', $id)->delete();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function participants(Request $req, string $event_id)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $event = DB::table('events')->where('id', $event_id)->first();
            if (!$event) {
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }
            if ($event->host_org_id !== $orgRow->org_id) {
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            $perPage = (int) $req->query('per_page', 15);
            $filter  = $req->query('filter', 'all');

            $q = DB::table('registrations as r')
                ->join('users as u', 'r.user_id', '=', 'u.id')
                ->leftJoin('payment_proofs as p', 'r.id', '=', 'p.reg_id')
                ->where('r.event_id', $event_id)
                ->select('r.*', 'u.school_id', 'u.first_name', 'u.last_name', 'p.status as proof_status');

            if ($filter === 'proof_review') {
                $q->where('p.status', 'Pending_Review');
            } elseif ($filter === 'pending') {
                $q->where('r.payment_status', 'Pending');
            }

            $res = $q->latest('r.created_at')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data'    => RegistrationResource::collection($res),
                'meta'    => [
                    'total'        => $res->total(),
                    'per_page'     => $res->perPage(),
                    'current_page' => $res->currentPage(),
                    'last_page'    => $res->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function approveProof(Request $req, string $reg_id)
    {
        DB::beginTransaction();
        try {
            $proof = DB::table('payment_proofs')->where('reg_id', $reg_id)->first();
            if (!$proof) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Proof not found.'], 404);
            }

            DB::table('payment_proofs')
                ->where('id', $proof->id)
                ->update(['status' => 'Approved', 'verified_by' => $req->user()->id, 'updated_at' => now()]);

            DB::table('registrations')
                ->where('id', $reg_id)
                ->update(['payment_status' => 'Paid', 'updated_at' => now()]);

            $userId = DB::table('registrations')->where('id', $reg_id)->value('user_id');

            (new NotificationService())->notify($userId, 'Payment_Success', $reg_id, 'Your payment has been approved.');

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function rejectProof(Request $req, string $reg_id)
    {
        try {
            $proof = DB::table('payment_proofs')->where('reg_id', $reg_id)->first();
            if (!$proof) {
                return response()->json(['success' => false, 'error' => 'Proof not found.'], 404);
            }

            DB::table('payment_proofs')
                ->where('id', $proof->id)
                ->update(['status' => 'Rejected', 'updated_at' => now()]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function verifySearch(VerifySearchRequest $req, string $event_id)
    {
        try {
            $eventAccess = $this->resolveOfficerEvent($req, $event_id);
            if (!$eventAccess) {
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            $query = $req->input('query');

            $reg = DB::table('registrations as r')
                ->join('users as u', 'r.user_id', '=', 'u.id')
                ->where('r.event_id', $event_id)
                ->where(function ($q) use ($query) {
                    $q->where('u.school_id', $query)
                      ->orWhere('u.first_name', 'like', "%$query%")
                      ->orWhere('u.last_name', 'like', "%$query%");
                })
                ->select('r.*', 'u.school_id', 'u.first_name', 'u.last_name')
                ->first();

            if (!$reg) {
                return response()->json(['success' => false, 'error' => 'Registration not found.'], 404);
            }

            return response()->json(['success' => true, 'data' => new RegistrationResource($reg)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function confirmPayment(Request $req, string $event_id, string $reg_id)
    {
        DB::beginTransaction();
        try {
            $eventAccess = $this->resolveOfficerEvent($req, $event_id);
            if (!$eventAccess) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            $registration = DB::table('registrations')
                ->where('id', $reg_id)
                ->where('event_id', $event_id)
                ->first();
            if (!$registration) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Registration not found.'], 404);
            }

            DB::table('registrations')
                ->where('id', $reg_id)
                ->update(['payment_status' => 'Paid', 'updated_at' => now()]);

            $userId = $registration->user_id;

            (new NotificationService())->notify($userId, 'Payment_Success', $reg_id, 'Your payment has been confirmed.');

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function checkin(Request $req, string $event_id, string $reg_id)
    {
        try {
            $eventAccess = $this->resolveOfficerEvent($req, $event_id);
            if (!$eventAccess) {
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            $registration = DB::table('registrations')
                ->where('id', $reg_id)
                ->where('event_id', $event_id)
                ->first();
            if (!$registration) {
                return response()->json(['success' => false, 'error' => 'Registration not found.'], 404);
            }

            DB::table('registrations')
                ->where('id', $reg_id)
                ->update([
                    'attendance_status' => 'Checked_In',
                    'check_in_at'       => now(),
                    'updated_at'        => now(),
                ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function sync(SyncRequest $req, string $event_id)
    {
        $items = $req->input('items', []);

        DB::beginTransaction();
        try {
            $eventAccess = $this->resolveOfficerEvent($req, $event_id);
            if (!$eventAccess) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            foreach ($items as $it) {
                $queueId = $it['id'] ?? null;
                $action  = $it['action_type'] ?? null;
                $regId   = $it['reg_id'] ?? null;

                if (!$queueId || !$action || !$regId) {
                    continue;
                }

                $regExists = DB::table('registrations')
                    ->where('id', $regId)
                    ->where('event_id', $event_id)
                    ->exists();
                if (!$regExists) {
                    continue;
                }

                if ($action === 'Verify_Payment') {
                    DB::table('registrations')
                        ->where('id', $regId)
                        ->update(['payment_status' => 'Paid', 'updated_at' => now()]);
                } elseif ($action === 'Check_In') {
                    DB::table('registrations')
                        ->where('id', $regId)
                        ->update([
                            'attendance_status' => 'Checked_In',
                            'check_in_at'       => now(),
                            'updated_at'        => now(),
                        ]);
                }

                DB::table('attendance_queue')
                    ->where('id', $queueId)
                    ->update(['sync_status' => 'Synced', 'updated_at' => now()]);
            }

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Sync failed.'], 500);
        }
    }
}
