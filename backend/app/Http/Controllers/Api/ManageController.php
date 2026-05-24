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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ManageController extends Controller
{
    private function buildEventRow(object $event): object
    {
        $paidStatuses = ['Paid', 'Confirmed'];
        $totalRegistered = (int) DB::table('registrations')->where('event_id', $event->id)->count();
        $totalPaid = (int) DB::table('registrations')->where('event_id', $event->id)->whereIn('payment_status', $paidStatuses)->count();
        $totalPending = (int) DB::table('registrations')->where('event_id', $event->id)->where('payment_status', 'Pending')->count();
        $proofsPendingReview = (int) DB::table('payment_proofs as p')
            ->join('registrations as r', 'p.reg_id', '=', 'r.id')
            ->where('r.event_id', $event->id)
            ->where('p.status', 'Pending_Review')
            ->count();
        $venueName = DB::table('venues')->where('id', $event->venue_id)->value('name');
        $categoryName = DB::table('event_categories')->where('id', $event->category_id)->value('name');

        return (object) array_merge((array) $event, [
            'venue_name' => $venueName,
            'category_name' => $categoryName,
            'total_registered' => $totalRegistered,
            'total_paid' => $totalPaid,
            'total_pending' => $totalPending,
            'proofs_pending_review' => $proofsPendingReview,
        ]);
    }
    /**
     * Resolve the active officer row for the authenticated user.
     * Returns null if the user is not an active officer.
     */
    private function resolveOfficer(Request $req): ?object
    {
        return DB::table('org_officers')
            ->where('user_id', $req->user()->id)
            ->where('is_active', 1)
            ->orderByDesc('created_at')
            ->first();
    }

    /**
     * Resolve active officer organization row for the authenticated user.
     */
    private function resolveOfficerOrg(Request $req): ?object
    {
        return DB::table('org_officers as oo')
            ->join('organizations as o', 'oo.org_id', '=', 'o.id')
            ->where('oo.user_id', $req->user()->id)
            ->where('oo.is_active', 1)
            ->orderByDesc('oo.created_at')
            ->select('oo.org_id', 'o.*')
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
            $orgRow = $this->resolveOfficerOrg($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $perPage = (int) $req->query('per_page', 15);
            $events = DB::table('events')
                ->where('host_org_id', $orgRow->org_id)
                ->latest()
                ->paginate($perPage);
            $enriched = array_map(fn ($e) => $this->buildEventRow($e), $events->items());

            return response()->json([
                'success' => true,
                'data'    => EventResource::collection($enriched),
                'org'     => new OrganizationResource($orgRow),
                'meta'    => [
                    'total'        => $events->total(),
                    'per_page'     => $events->perPage(),
                    'current_page' => $events->currentPage(),
                    'last_page'    => $events->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ManageController::dashboard failed', [
                'user_id' => $req->user()?->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function orgProfile(Request $req)
    {
        try {
            $orgRow = $this->resolveOfficerOrg($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Org not found.'], 404);
            }

            $officers = DB::table('org_officers')->where('org_id', $orgRow->org_id)->get();

            return response()->json([
                'success' => true,
                'data'    => [
                    'org'      => new OrganizationResource($orgRow),
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
            $bannerUrl = $req->input('banner_url');
            if ($req->hasFile('banner_file')) {
                $file = $req->file('banner_file');
                $path = $file->storePublicly('event_banners', 'public');
                $bannerUrl = Storage::url($path);
            }

            $payload = array_merge(
                $req->only([
                    'venue_id', 'category_id', 'title', 'description',
                    'start_date', 'end_date', 'capacity', 'audience_type',
                    'is_paid', 'payment_instructions', 'status',
                ]),
                [
                    'id'           => $id,
                    'host_org_id'  => $orgRow->org_id,
                    'banner_url'   => $bannerUrl,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]
            );

            DB::table('events')->insert($payload);
            $event = DB::table('events')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new EventResource($event)], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function event(Request $req, string $id)
    {
        try {
            $eventAccess = $this->resolveOfficerEvent($req, $id);
            if (!$eventAccess) {
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }
            $row = $this->buildEventRow($eventAccess->event);
            return response()->json(['success' => true, 'data' => new EventResource($row)]);
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

            $bannerUrl = $req->input('banner_url');
            if ($req->hasFile('banner_file')) {
                $file = $req->file('banner_file');
                $path = $file->storePublicly('event_banners', 'public');
                $bannerUrl = Storage::url($path);
            }

            $data = $req->only([
                'venue_id', 'category_id', 'title', 'description',
                'start_date', 'end_date', 'capacity', 'audience_type',
                'is_paid', 'payment_instructions', 'status',
            ]);
            $data['banner_url'] = $bannerUrl;

            DB::table('events')
                ->where('id', $id)
                ->update(array_merge($data, ['updated_at' => now()]));

            $nextStatus = $data['status'] ?? null;
            if ($nextStatus === 'Cancelled' && ($event->status ?? null) !== 'Cancelled') {
                $userIds = DB::table('registrations')
                    ->where('event_id', $id)
                    ->pluck('user_id');

                $notification = new NotificationService();
                foreach ($userIds as $userId) {
                    $notification->notify(
                        (string) $userId,
                        'Event_Cancelled',
                        $id,
                        'An event you registered for has been cancelled: ' . ($event->title ?? 'Untitled Event')
                    );
                }
            }

            $updated = DB::table('events')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new EventResource($updated)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function deleteEvent(Request $req, string $id)
    {
        DB::beginTransaction();
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $event = DB::table('events')->where('id', $id)->first();
            if (!$event) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }
            if ($event->host_org_id !== $orgRow->org_id) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            DB::table('notifications')->where('reference_id', $id)->delete();
            DB::table('events')->where('id', $id)->delete();

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
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
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->leftJoin('payment_proofs as p', 'r.id', '=', 'p.reg_id')
                ->where('r.event_id', $event_id)
                ->select(
                    'r.*',
                    'u.school_id',
                    'u.first_name',
                    'u.last_name',
                    'u.year_level',
                    'd.code as dept_code',
                    'p.status as proof_status',
                    'p.image_url as proof_image_url',
                    'p.uploaded_at as proof_uploaded_at'
                );

            if ($filter === 'proof_review') {
                $q->where('p.status', 'Pending_Review');
            } elseif ($filter === 'pending') {
                $q->where('r.payment_status', 'Pending');
            }

            $res = $q->latest('r.created_at')->paginate($perPage);
            $event = DB::table('events')->where('id', $event_id)->first();
            $eventMeta = $event ? $this->buildEventRow($event) : null;

            return response()->json([
                'success' => true,
                // Return a flat array to keep frontend consumers stable.
                'data'    => RegistrationResource::collection(collect($res->items())),
                'event'   => $eventMeta ? new EventResource($eventMeta) : null,
                'meta'    => [
                    'total'        => $res->total(),
                    'per_page'     => $res->perPage(),
                    'current_page' => $res->currentPage(),
                    'last_page'    => $res->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ManageController::participants failed', [
                'event_id' => $event_id,
                'user_id' => $req->user()?->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
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
            Log::error('ManageController::verifySearch failed', [
                'event_id' => $event_id,
                'user_id' => $req->user()?->id,
                'query' => $req->input('query'),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
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

    public function members(Request $req)
    {
        try {
            $orgRow = $this->resolveOfficer($req);
            if (!$orgRow) {
                return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
            }

            $rows = DB::table('org_members as m')
                ->join('users as u', 'm.user_id', '=', 'u.id')
                ->leftJoin('courses as c', 'u.course_id', '=', 'c.id')
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->where('m.org_id', $orgRow->org_id)
                ->select(
                    'm.*',
                    'u.school_id', 'u.first_name', 'u.last_name', 'u.email', 'u.year_level', 'u.section',
                    'c.course_code as course_code',
                    'd.code as dept_code'
                )
                ->orderByDesc('m.created_at')
                ->get();

            $officerUserIds = DB::table('org_officers')
                ->where('org_id', $orgRow->org_id)
                ->where('is_active', 1)
                ->pluck('user_id')
                ->flip();

            $data = $rows->map(function ($r) use ($officerUserIds) {
                return [
                    'id' => $r->id,
                    'user_id' => $r->user_id,
                    'org_id' => $r->org_id,
                    'membership_status' => $r->membership_status,
                    'paid_membership_fee' => (bool) $r->paid_membership_fee,
                    'joined_at' => $r->joined_at,
                    'updated_at' => $r->updated_at,
                    'school_id' => $r->school_id,
                    'first_name' => $r->first_name,
                    'last_name' => $r->last_name,
                    'email' => $r->email,
                    'course' => $r->course_code,
                    'dept' => $r->dept_code,
                    'year_level' => (int) ($r->year_level ?? 0),
                    'section' => (int) ($r->section ?? 0),
                    'is_officer' => isset($officerUserIds[$r->user_id]),
                ];
            })->values();

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function lookupMember(Request $req)
    {
        $schoolId = trim((string) $req->query('school_id', ''));
        if ($schoolId === '') {
            return response()->json(['success' => false, 'error' => 'school_id is required.'], 422);
        }
        // Log incoming lookup for debugging — helps diagnose whitespace/active-flag mismatches
        Log::debug('Manage::lookupMember called', ['school_id' => $schoolId, 'user_id' => optional($req->user())->id ?? null]);

        $user = DB::table('users as u')
            ->leftJoin('courses as c', 'u.course_id', '=', 'c.id')
            ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
            ->whereRaw('TRIM(u.school_id) = ?', [$schoolId])
            ->where('u.is_active', 1)
            ->select('u.id', 'u.school_id', 'u.first_name', 'u.last_name', 'u.email', 'u.year_level', 'u.section', 'c.course_code as course_code', 'd.code as dept_code')
            ->first();

        if (!$user) {
            // Check whether an account exists but is inactive or has unexpected whitespace
            $raw = DB::table('users as u')
                ->whereRaw('TRIM(u.school_id) = ?', [$schoolId])
                ->select('u.id', 'u.school_id', 'u.is_active')
                ->first();

            if ($raw) {
                Log::debug('Manage::lookupMember found user but not active', ['school_id' => $raw->school_id, 'is_active' => $raw->is_active, 'id' => $raw->id]);
                return response()->json([
                    'success' => false,
                    'error' => 'Account is deactivated.',
                    'data' => [
                        'user_id' => $raw->id,
                        'school_id' => $raw->school_id,
                        'is_active' => (bool) $raw->is_active,
                    ],
                ], 422);
            } else {
                // Try loose match to help debug unexpected characters
                $loose = DB::table('users as u')
                    ->where('u.school_id', 'like', "%{$schoolId}%")
                    ->select('u.id', 'u.school_id', 'u.is_active')
                    ->first();
                if ($loose) {
                    Log::debug('Manage::lookupMember loose match found', ['db_school_id' => $loose->school_id, 'is_active' => $loose->is_active, 'id' => $loose->id]);
                }
            }

            return response()->json(['success' => false, 'error' => 'No verified account found with that Student ID.'], 404);
        }

        return response()->json(['success' => true, 'data' => $user]);
    }

    public function addMember(Request $req)
    {
        $req->validate(['user_id' => 'required|uuid']);
        $orgRow = $this->resolveOfficer($req);
        if (!$orgRow) return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);

        $exists = DB::table('org_members')->where('org_id', $orgRow->org_id)->where('user_id', $req->input('user_id'))->exists();
        if ($exists) return response()->json(['success' => false, 'error' => 'User is already a member.'], 422);

        $id = (string) Str::uuid();
        DB::table('org_members')->insert([
            'id' => $id,
            'user_id' => $req->input('user_id'),
            'org_id' => $orgRow->org_id,
            'membership_status' => 'Active',
            'paid_membership_fee' => 0,
            'joined_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
    }

    public function updateMember(Request $req, string $id)
    {
        $orgRow = $this->resolveOfficer($req);
        if (!$orgRow) return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);

        $member = DB::table('org_members')->where('id', $id)->where('org_id', $orgRow->org_id)->first();
        if (!$member) return response()->json(['success' => false, 'error' => 'Member not found.'], 404);

        $payload = [];
        if ($req->has('membership_status')) $payload['membership_status'] = $req->input('membership_status');
        if ($req->has('paid_membership_fee')) $payload['paid_membership_fee'] = $req->boolean('paid_membership_fee');
        if (empty($payload)) return response()->json(['success' => false, 'error' => 'Nothing to update.'], 422);

        $payload['updated_at'] = now();
        DB::table('org_members')->where('id', $id)->update($payload);
        return response()->json(['success' => true]);
    }
}
