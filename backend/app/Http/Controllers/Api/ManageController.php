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
use App\Services\EventStatusService;
use App\Services\NotificationService;
use App\Support\RouteKeyResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ManageController extends Controller
{
    public function __construct(private readonly EventStatusService $eventStatusService)
    {
    }

    private function deletePublicManagedImage(?string $url, string $expectedPrefix): void
    {
        if (!$url) {
            return;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            return;
        }

        $storagePrefix = '/storage/';
        $prefixPos = strpos($path, $storagePrefix);
        if ($prefixPos === false) {
            return;
        }

        $relativePath = substr($path, $prefixPos + strlen($storagePrefix));
        if (!is_string($relativePath) || $relativePath === '') {
            return;
        }

        if (!str_starts_with($relativePath, $expectedPrefix . '/')) {
            return;
        }

        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }

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
            'organization_slug' => DB::table('organizations')->where('id', $event->host_org_id)->value('slug'),
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
        $selectedOrgId = $this->selectedOrgId($req);

        $query = DB::table('org_officers')
            ->where('user_id', $req->user()->id)
            ->where('is_active', 1);

        if ($selectedOrgId) {
            $query->where('org_id', $selectedOrgId);
        }

        return $query->orderByDesc('created_at')
            ->first();
    }

    /**
     * Resolve active officer organization row for the authenticated user.
     */
    private function resolveOfficerOrg(Request $req): ?object
    {
        $selectedOrgId = $this->selectedOrgId($req);

        $query = DB::table('org_officers as oo')
            ->join('organizations as o', 'oo.org_id', '=', 'o.id')
            ->where('oo.user_id', $req->user()->id)
            ->where('oo.is_active', 1);

        if ($selectedOrgId) {
            $query->where('oo.org_id', $selectedOrgId);
        }

        return $query->orderByDesc('oo.created_at')
            ->select('oo.org_id', 'oo.position', 'o.*')
            ->first();
    }

    private function selectedOrgId(Request $req): ?string
    {
        $value = $req->header('X-Manage-Org-Id') ?: $req->query('org_id') ?: $req->input('org_id');
        $value = is_string($value) ? trim($value) : '';

        return $value !== '' ? $value : null;
    }

    public function organizations(Request $req)
    {
        try {
            $rows = DB::table('org_officers as oo')
                ->join('organizations as o', 'oo.org_id', '=', 'o.id')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->where('oo.user_id', $req->user()->id)
                ->where('oo.is_active', 1)
                ->orderByDesc('oo.created_at')
                ->select('oo.org_id', 'oo.position', 'o.*', 'c.name as category_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $rows->map(fn ($row) => [
                    'id' => $row->org_id,
                    'slug' => $row->slug ?: $row->org_id,
                    'name' => $row->name,
                    'code_name' => $row->code_name,
                    'logo_url' => $row->logo_url,
                    'category_name' => $row->category_name,
                    'accreditation_status' => $row->accreditation_status,
                    'position' => trim((string) ($row->position ?? 'Officer')) ?: 'Officer',
                ])->values(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
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

        $resolvedEventId = RouteKeyResolver::resolveEventId($eventId);
        if (!$resolvedEventId) {
            return null;
        }

        $event = DB::table('events')
            ->where('id', $resolvedEventId)
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
            $this->eventStatusService->markEndedEventsCompleted(orgId: $orgRow->org_id);

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

            $currentOrg = DB::table('organizations')->select('logo_url')->where('id', $orgRow->org_id)->first();
            $data = $req->only(['name', 'description', 'logo_url', 'adviser']);
            if ($req->filled('name')) {
                $data['slug'] = RouteKeyResolver::uniqueSlug('organizations', (string) $req->input('name'), $orgRow->org_id);
            }
            if ($req->hasFile('logo_file')) {
                $this->deletePublicManagedImage($currentOrg->logo_url ?? null, 'organization_logos');
                $path = $req->file('logo_file')->storePublicly('organization_logos', 'public');
                $data['logo_url'] = Storage::url($path);
            } elseif ($req->boolean('remove_logo')) {
                $this->deletePublicManagedImage($currentOrg->logo_url ?? null, 'organization_logos');
                $data['logo_url'] = null;
            }
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

            $feeAmount = $req->input('price');
            if (is_numeric($feeAmount)) {
                $feeAmount = (float) $feeAmount;
            } else {
                $feeAmount = $req->input('is_paid') ? 0.0 : null;
            }

            $payload = array_merge(
                $req->only([
                    'venue_id', 'category_id', 'title', 'description',
                    'start_date', 'end_date', 'capacity', 'audience_type',
                    'is_paid', 'payment_instructions', 'status',
                ]),
                [
                    'id'           => $id,
                    'slug'         => RouteKeyResolver::uniqueSlug(
                        'events',
                        trim((string) $req->input('title')) . ' ' . trim((string) $req->input('start_date'))
                    ),
                    'host_org_id'  => $orgRow->org_id,
                    'banner_url'   => $bannerUrl,
                    'fee_amount'   => $feeAmount,
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
            $this->eventStatusService->markEndedEventsCompleted((string) $eventAccess->event->id);
            $eventAccess->event = DB::table('events')->where('id', $eventAccess->event->id)->first();
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

            $resolvedEventId = RouteKeyResolver::resolveEventId($id);
            if (!$resolvedEventId) {
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }

            $event = DB::table('events')->where('id', $resolvedEventId)->first();
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
            if ($req->filled('title') || $req->filled('start_date')) {
                $slugTitle = trim((string) ($req->input('title') ?? $event->title ?? 'event'));
                $slugStartDate = trim((string) ($req->input('start_date') ?? $event->start_date ?? ''));
                $data['slug'] = RouteKeyResolver::uniqueSlug(
                    'events',
                    $slugTitle . ' ' . $slugStartDate,
                    $event->id
                );
            }

            if ($req->filled('price')) {
                $data['fee_amount'] = (float) $req->input('price');
            } elseif ($req->has('is_paid') && !$req->boolean('is_paid')) {
                $data['fee_amount'] = 0.0;
            }

            DB::table('events')
                ->where('id', $resolvedEventId)
                ->update(array_merge($data, ['updated_at' => now()]));
            $this->eventStatusService->markEndedEventsCompleted($resolvedEventId);

            $nextStatus = $data['status'] ?? null;
            if ($nextStatus === 'Cancelled' && ($event->status ?? null) !== 'Cancelled') {
                $userIds = DB::table('registrations')
                    ->where('event_id', $resolvedEventId)
                    ->pluck('user_id');

                $notification = new NotificationService();
                foreach ($userIds as $userId) {
                    $notification->notify(
                        (string) $userId,
                        'Event_Cancelled',
                        $resolvedEventId,
                        'An event you registered for has been cancelled: ' . ($event->title ?? 'Untitled Event')
                    );
                }
            }

            $updated = DB::table('events')->where('id', $resolvedEventId)->first();

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

            $resolvedEventId = RouteKeyResolver::resolveEventId($id);
            if (!$resolvedEventId) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }

            $event = DB::table('events')->where('id', $resolvedEventId)->first();
            if (!$event) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }
            if ($event->host_org_id !== $orgRow->org_id) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }

            DB::table('notifications')->where('reference_id', $resolvedEventId)->delete();
            DB::table('events')->where('id', $resolvedEventId)->delete();

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
            $eventAccess = $this->resolveOfficerEvent($req, $event_id);
            if (!$eventAccess) {
                return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
            }
            $resolvedEventId = (string) $eventAccess->event->id;
            $this->eventStatusService->markEndedEventsCompleted($resolvedEventId);

            $perPage = (int) $req->query('per_page', 15);
            $filter  = $req->query('filter', 'all');

            $q = DB::table('registrations as r')
                ->join('users as u', 'r.user_id', '=', 'u.id')
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->leftJoin('payment_proofs as p', 'r.id', '=', 'p.reg_id')
                ->where('r.event_id', $resolvedEventId)
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
            $event = DB::table('events')->where('id', $resolvedEventId)->first();
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
            $resolvedEventId = (string) $eventAccess->event->id;

            $query = $req->input('query');

            $reg = DB::table('registrations as r')
                ->join('users as u', 'r.user_id', '=', 'u.id')
                ->leftJoin('courses as c', 'u.course_id', '=', 'c.id')
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->leftJoin('org_members as om', function ($join) use ($eventAccess) {
                    $join->on('om.user_id', '=', 'u.id')
                        ->where('om.org_id', '=', $eventAccess->event->host_org_id)
                        ->whereRaw("LOWER(TRIM(om.membership_status)) = 'active'")
                        ->where('om.paid_membership_fee', 1);
                })
                ->where('r.event_id', $resolvedEventId)
                ->where(function ($q) use ($query) {
                    $q->where('u.school_id', $query)
                      ->orWhere('u.first_name', 'like', "%$query%")
                      ->orWhere('u.last_name', 'like', "%$query%");
                })
                ->select(
                    'r.*',
                    'u.school_id',
                    'u.first_name',
                    'u.last_name',
                    'u.year_level',
                    'u.section',
                    'c.course_code',
                    'd.code as dept_code',
                    DB::raw('CASE WHEN om.id IS NULL THEN 0 ELSE 1 END as member_status')
                )
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
            $resolvedEventId = (string) $eventAccess->event->id;

            $registration = DB::table('registrations')
                ->where('id', $reg_id)
                ->where('event_id', $resolvedEventId)
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
            $resolvedEventId = (string) $eventAccess->event->id;

            $registration = DB::table('registrations')
                ->where('id', $reg_id)
                ->where('event_id', $resolvedEventId)
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
            $resolvedEventId = (string) $eventAccess->event->id;

            foreach ($items as $it) {
                $queueId = $it['id'] ?? null;
                $action  = $it['action_type'] ?? null;
                $regId   = $it['reg_id'] ?? null;

                if (!$queueId || !$action || !$regId) {
                    continue;
                }

                $regExists = DB::table('registrations')
                    ->where('id', $regId)
                    ->where('event_id', $resolvedEventId)
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
