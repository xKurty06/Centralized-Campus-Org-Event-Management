<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\RegisterEventRequest;
use App\Http\Requests\Event\PaymentUploadRequest;
use App\Http\Resources\EventResource;
use App\Http\Resources\RegistrationResource;
use App\Http\Resources\PaymentProofResource;
use App\Services\EventStatusService;
use App\Services\RegistrationService;
use App\Support\RouteKeyResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function __construct(private readonly EventStatusService $eventStatusService)
    {
    }

    public function index(Request $req)
    {
        try {
            $this->eventStatusService->markEndedEventsCompleted();
            $perPage = (int) $req->query('per_page', 15);
            $query = DB::table('events as e')
                ->leftJoin('event_categories as ec', 'e.category_id', '=', 'ec.id')
                ->leftJoin('venues as v', 'e.venue_id', '=', 'v.id')
                ->leftJoin('organizations as o', 'e.host_org_id', '=', 'o.id')
                ->select(
                    'e.*',
                    'ec.name as category_name',
                    'v.name as venue_name',
                    'o.slug as organization_slug',
                    'o.name as organization_name',
                    DB::raw("(select count(*) from registrations r where r.event_id = e.id) as total_registered")
                );

            if ($req->filled('org_id')) {
                $orgRouteKey = (string) $req->org_id;
                $query->where('e.host_org_id', RouteKeyResolver::resolveOrganizationId($orgRouteKey) ?? $orgRouteKey);
            }
            if ($req->filled('category_id')) {
                $query->where('e.category_id', $req->category_id);
            }
            if ($req->filled('venue_id')) {
                $query->where('e.venue_id', $req->venue_id);
            }
            if ($req->filled('audience_type')) {
                $query->where('e.audience_type', $req->audience_type);
            }
            if ($req->filled('adviser')) {
                $query->where('e.adviser', $req->adviser);
            }

            $events = $query->latest('e.created_at')->paginate($perPage);
            return response()->json([
                'success' => true,
                'data' => EventResource::collection($events),
                'meta' => [
                    'total' => $events->total(),
                    'per_page' => $events->perPage(),
                    'current_page' => $events->currentPage(),
                    'last_page' => $events->lastPage(),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('EventController::index failed', [
                'user_id' => $req->user()?->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function show($id)
    {
        $user = null;
        try {
            $eventId = RouteKeyResolver::resolveEventId((string) $id);
            if (!$eventId) {
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }
            $this->eventStatusService->markEndedEventsCompleted($eventId);
            $sanctumUser = Auth::guard('sanctum')->user();
            $webUser = Auth::user();
            $user = $sanctumUser ?? $webUser;
            $event = DB::table('events as e')
                ->leftJoin('venues as v', 'e.venue_id', '=', 'v.id')
                ->leftJoin('event_categories as ec', 'e.category_id', '=', 'ec.id')
                ->leftJoin('organizations as o', 'e.host_org_id', '=', 'o.id')
                ->leftJoin('org_categories as oc', 'o.category_id', '=', 'oc.id')
                ->where('e.id', $eventId)
                ->select(
                    'e.*',
                    'v.name as venue_name',
                    'ec.name as category_name',
                    'o.slug as organization_slug',
                    'o.name as organization_name',
                    'oc.name as organization_category',
                    'o.adviser as adviser',
                    DB::raw("(select count(*) from registrations r where r.event_id = e.id) as total_registered"),
                    DB::raw("(select count(*) from org_members m where m.org_id = o.id) as org_members_count")
                )
                ->first();
            if (!$event) return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            $eventRow = (object) array_merge((array) $event, ['is_member' => null, 'is_registered' => false]);
            if ($user) {
                $eventRow->is_member = $this->resolveEventMembership($user->id, $event->host_org_id);
                $registration = DB::table('registrations')
                    ->where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->select('id', 'payment_status')
                    ->first();
                $eventRow->is_registered = $registration !== null;
                $eventRow->registration_payment_status = $registration->payment_status ?? null;
            }
            return response()->json(['success' => true, 'data' => new EventResource($eventRow)], 200);
        } catch (\Exception $e) {
            Log::error('EventController::show failed', [
                'event_id' => $eventId ?? $id,
                'user_id' => $user?->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function myEvents(Request $req)
    {
        try {
            $user = $req->user();
            $this->eventStatusService->markEndedEventsCompleted();
            $perPage = (int) $req->query('per_page', 15);
            $regs = DB::table('registrations as r')
                ->join('events as e', 'r.event_id', '=', 'e.id')
                ->leftJoin('venues as v', 'e.venue_id', '=', 'v.id')
                ->leftJoin('event_categories as ec', 'e.category_id', '=', 'ec.id')
                ->leftJoin('organizations as o', 'e.host_org_id', '=', 'o.id')
                ->leftJoin('payment_proofs as pp', 'pp.reg_id', '=', 'r.id')
                ->where('r.user_id', $user->id)
                ->select(
                    'r.*',
                    'e.title as event_title',
                    'e.slug as event_slug',
                    'e.status as event_status',
                    'e.start_date as event_start_date',
                    'e.end_date as event_end_date',
                    'e.is_paid as event_is_paid',
                    'e.fee_amount as event_fee_amount',
                    'e.banner_url as event_banner_url',
                    'v.name as venue_name',
                    'ec.name as category_name',
                    'o.name as org_name',
                    'pp.status as proof_status',
                    'pp.image_url as proof_image_url',
                    'pp.uploaded_at as proof_uploaded_at'
                )
                ->latest('r.created_at')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => RegistrationResource::collection($regs->items()),
                'meta' => [
                    'total' => $regs->total(),
                    'per_page' => $regs->perPage(),
                    'current_page' => $regs->currentPage(),
                    'last_page' => $regs->lastPage(),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('EventController::myEvents failed', [
                'user_id' => optional($req->user())->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function register(RegisterEventRequest $req, $id)
    {
        try {
            $user = $req->user();
            $eventId = RouteKeyResolver::resolveEventId((string) $id);
            if (!$eventId) return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            $this->eventStatusService->markEndedEventsCompleted($eventId);
            $event = DB::table('events')->where('id', $eventId)->first();
            if (!$event) return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            if (($event->status ?? null) === 'Completed') {
                return response()->json(['success' => false, 'error' => 'Registration is closed because this event has ended.'], 400);
            }
            if ($event->audience_type === 'Org_Members_Only') {
                $isMember = $this->resolveEventMembership($user->id, $event->host_org_id);
                if (!$isMember) {
                    return response()->json(['success' => false, 'error' => 'Only active organization members can register for this event.'], 403);
                }
            }
            $payment_selection = $req->input('payment_selection', 'N/A');
            $service = new RegistrationService();
            $service->register($eventId, $user->id, $payment_selection);
            return response()->json(['success' => true, 'message' => 'Registration successful.'], 201);
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            Log::warning('EventController::register failed', [
                'event_id' => $eventId ?? $id,
                'user_id' => $user?->id,
                'message' => $msg,
            ]);
            return response()->json(['success' => false, 'error' => $msg ?: 'Registration failed.'], 400);
        }
    }

    private function resolveEventMembership($userId, $orgId)
    {
        return DB::table('org_members')
            ->where('org_id', $orgId)
            ->where('user_id', $userId)
            ->whereRaw("LOWER(TRIM(membership_status)) = 'active'")
            ->where('paid_membership_fee', 1)
            ->exists()
            || DB::table('org_officers')
                ->where('org_id', $orgId)
                ->where('user_id', $userId)
                ->where('is_active', 1)
                ->exists();
    }

    public function paymentUpload(PaymentUploadRequest $req, $id)
    {
        try {
            $user = $req->user();
            $file = $req->file('image');
            if (!$file) return response()->json(['success' => false, 'error' => 'No file uploaded.'], 400);
            $eventId = RouteKeyResolver::resolveEventId((string) $id);
            if (!$eventId) return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            $path = $file->storePublicly('payment_proofs', 'public');
            $publicUrl = Storage::url($path);
            $reg = DB::table('registrations')->where('event_id', $eventId)->where('user_id', $user->id)->first();
            if (!$reg) return response()->json(['success' => false, 'error' => 'Registration not found.'], 404);
            $proof = DB::table('payment_proofs')->where('reg_id', $reg->id)->first();
            if ($proof) {
                DB::table('payment_proofs')->where('id', $proof->id)->update(['image_url' => $publicUrl, 'uploaded_at' => now(), 'status' => 'Pending_Review', 'updated_at' => now()]);
                $data = DB::table('payment_proofs')->where('id', $proof->id)->first();
            } else {
                $proofId = (string) Str::uuid();
                DB::table('payment_proofs')->insert(['id' => $proofId, 'reg_id' => $reg->id, 'image_url' => $publicUrl, 'uploaded_at' => now(), 'status' => 'Pending_Review', 'created_at' => now(), 'updated_at' => now()]);
                $data = DB::table('payment_proofs')->where('id', $proofId)->first();
            }
            return response()->json(['success' => true, 'data' => new PaymentProofResource($data)], 201);
        } catch (\Exception $e) {
            Log::error('EventController::paymentUpload failed', [
                'event_id' => $eventId ?? $id,
                'user_id' => $req->user()?->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function organizations(Request $req)
    {
        try {
            $perPage = (int) $req->query('per_page', 15);
            $orgs = DB::table('organizations as o')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->select(
                    'o.*',
                    'o.code_name',
                    'o.founded_date',
                    'c.name as category_name',
                    DB::raw("(select count(*) from org_members m where m.org_id = o.id) as members_count"),
                    DB::raw("(select count(*) from events e where e.host_org_id = o.id and year(e.start_date) = year(curdate())) as events_this_year")
                )
                ->latest('o.created_at')
                ->paginate($perPage);
            return response()->json([
                'success' => true,
                'data' => \App\Http\Resources\OrganizationResource::collection($orgs->items()),
                'meta' => [
                    'total' => $orgs->total(),
                    'per_page' => $orgs->perPage(),
                    'current_page' => $orgs->currentPage(),
                    'last_page' => $orgs->lastPage(),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('EventController::organizations failed', [
                'user_id' => $req->user()?->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function organization($id)
    {
        try {
            $orgId = RouteKeyResolver::resolveOrganizationId((string) $id);
            if (!$orgId) return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            $org = DB::table('organizations as o')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->where('o.id', $orgId)
                ->select(
                    'o.*',
                    'o.code_name',
                    'o.founded_date',
                    'c.name as category_name',
                    DB::raw("(select count(*) from org_members m where m.org_id = o.id) as members_count"),
                    DB::raw("(select count(*) from events e where e.host_org_id = o.id and year(e.start_date) = year(curdate())) as events_this_year")
                )
                ->first();
            if (!$org) return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);

            $officers = DB::table('org_officers as oo')
                ->leftJoin('users as u', 'oo.user_id', '=', 'u.id')
                ->leftJoin('courses as cc', 'u.course_id', '=', 'cc.id')
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->select(
                    'oo.id',
                    'oo.org_id',
                    'oo.user_id',
                    'oo.position',
                    'oo.is_active',
                    'oo.created_at',
                    'oo.updated_at',
                    'u.first_name',
                    'u.last_name',
                    'u.school_id',
                    'u.email',
                    'u.year_level',
                    'u.section',
                    'cc.course_code as course_code',
                    'cc.course_name as course_name',
                    'd.name as department',
                    'd.code as department_code'
                )
                ->where('oo.org_id', $orgId)
                ->orderByDesc('oo.is_active')
                ->orderBy('u.last_name')
                ->orderBy('u.first_name')
                ->get();

            $members = DB::table('org_members as om')
                ->leftJoin('users as u', 'om.user_id', '=', 'u.id')
                ->leftJoin('courses as c', 'u.course_id', '=', 'c.id')
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->where('om.org_id', $orgId)
                ->select(
                    'om.id',
                    'om.org_id',
                    'om.user_id',
                    'om.membership_status',
                    'om.paid_membership_fee',
                    'om.created_at',
                    'om.updated_at',
                    'u.first_name',
                    'u.last_name',
                    'u.school_id',
                    'u.email',
                    'u.year_level',
                    'u.section',
                    'c.course_code as course_code',
                    'd.name as department',
                    'd.code as department_code'
                )
                ->orderByDesc('om.created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'org' => new \App\Http\Resources\OrganizationResource($org),
                    'officers' => \App\Http\Resources\OrgOfficerResource::collection($officers),
                    'members' => $members,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('EventController::organization failed', [
                'org_id' => $orgId ?? $id,
                'user_id' => Auth::guard('sanctum')->user()?->id ?? Auth::user()?->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }
}
