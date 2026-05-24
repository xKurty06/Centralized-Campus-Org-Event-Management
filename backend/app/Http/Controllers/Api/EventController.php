<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\RegisterEventRequest;
use App\Http\Requests\Event\PaymentUploadRequest;
use App\Http\Resources\EventResource;
use App\Http\Resources\RegistrationResource;
use App\Http\Resources\PaymentProofResource;
use App\Services\RegistrationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(Request $req)
    {
        try {
            $perPage = (int) $req->query('per_page', 15);
            $query = DB::table('events');

            if ($req->filled('org_id')) {
                $query->where('host_org_id', $req->org_id);
            }
            if ($req->filled('category_id')) {
                $query->where('category_id', $req->category_id);
            }
            if ($req->filled('venue_id')) {
                $query->where('venue_id', $req->venue_id);
            }
            if ($req->filled('audience_type')) {
                $query->where('audience_type', $req->audience_type);
            }

            $events = $query->latest()->paginate($perPage);
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
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = request()->user();
            $event = DB::table('events as e')
                ->leftJoin('venues as v', 'e.venue_id', '=', 'v.id')
                ->leftJoin('event_categories as ec', 'e.category_id', '=', 'ec.id')
                ->leftJoin('organizations as o', 'e.host_org_id', '=', 'o.id')
                ->leftJoin('org_categories as oc', 'o.category_id', '=', 'oc.id')
                ->where('e.id', $id)
                ->select(
                    'e.*',
                    'v.name as venue_name',
                    'ec.name as category_name',
                    'o.name as organization_name',
                    'oc.name as organization_category',
                    DB::raw("(select count(*) from registrations r where r.event_id = e.id) as total_registered")
                )
                ->first();
            if (!$event) return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            $data = (new EventResource($event))->toArray(request());
            $data['is_member'] = false;
            if ($user) {
                $data['is_member'] = DB::table('org_members')
                    ->where('org_id', $event->host_org_id)
                    ->where('user_id', $user->id)
                    ->where('membership_status', 'Active')
                    ->exists();
            }
            return response()->json(['success' => true, 'data' => $data], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function myEvents(Request $req)
    {
        try {
            $user = $req->user();
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
                    'e.status as event_status',
                    'e.start_date as event_start_date',
                    'e.end_date as event_end_date',
                    'e.is_paid as event_is_paid',
                    'e.fee_amount as event_fee_amount',
                    'e.banner_url as event_banner_url',
                    'v.name as venue_name',
                    'ec.name as category_name',
                    'o.name as org_name',
                    'pp.status as proof_status'
                )
                ->latest('r.created_at')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => RegistrationResource::collection($regs),
                'meta' => [
                    'total' => $regs->total(),
                    'per_page' => $regs->perPage(),
                    'current_page' => $regs->currentPage(),
                    'last_page' => $regs->lastPage(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function register(RegisterEventRequest $req, $id)
    {
        try {
            $user = $req->user();
            $event = DB::table('events')->where('id', $id)->first();
            if (!$event) return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            if ($event->audience_type === 'Org_Members_Only') {
                $isMember = DB::table('org_members')
                    ->where('org_id', $event->host_org_id)
                    ->where('user_id', $user->id)
                    ->where('membership_status', 'Active')
                    ->exists();
                if (!$isMember) {
                    return response()->json(['success' => false, 'error' => 'Only active organization members can register for this event.'], 403);
                }
            }
            $payment_selection = $req->input('payment_selection', 'N/A');
            $service = new RegistrationService();
            $service->register($id, $user->id, $payment_selection);
            return response()->json(['success' => true, 'message' => 'Registration successful.'], 201);
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            return response()->json(['success' => false, 'error' => $msg ?: 'Registration failed.'], 400);
        }
    }

    public function paymentUpload(PaymentUploadRequest $req, $id)
    {
        try {
            $user = $req->user();
            $file = $req->file('image');
            if (!$file) return response()->json(['success' => false, 'error' => 'No file uploaded.'], 400);
            $path = $file->store('payment_proofs');
            $reg = DB::table('registrations')->where('event_id', $id)->where('user_id', $user->id)->first();
            if (!$reg) return response()->json(['success' => false, 'error' => 'Registration not found.'], 404);
            $proof = DB::table('payment_proofs')->where('reg_id', $reg->id)->first();
            if ($proof) {
                DB::table('payment_proofs')->where('id', $proof->id)->update(['image_url' => $path, 'uploaded_at' => now(), 'status' => 'Pending_Review', 'updated_at' => now()]);
                $data = DB::table('payment_proofs')->where('id', $proof->id)->first();
            } else {
                $proofId = (string) Str::uuid();
                DB::table('payment_proofs')->insert(['id' => $proofId, 'reg_id' => $reg->id, 'image_url' => $path, 'uploaded_at' => now(), 'status' => 'Pending_Review', 'created_at' => now(), 'updated_at' => now()]);
                $data = DB::table('payment_proofs')->where('id', $proofId)->first();
            }
            return response()->json(['success' => true, 'data' => new PaymentProofResource($data)], 201);
        } catch (\Exception $e) {
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
                    DB::raw("(select count(*) from org_members m where m.org_id = o.id and m.membership_status = 'Active') as members_count"),
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
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function organization($id)
    {
        try {
            $org = DB::table('organizations as o')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->where('o.id', $id)
                ->select(
                    'o.*',
                    'o.code_name',
                    'o.founded_date',
                    'c.name as category_name',
                    DB::raw("(select count(*) from org_members m where m.org_id = o.id and m.membership_status = 'Active') as members_count"),
                    DB::raw("(select count(*) from events e where e.host_org_id = o.id and year(e.start_date) = year(curdate())) as events_this_year")
                )
                ->first();
            if (!$org) return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            return response()->json(['success' => true, 'data' => new \App\Http\Resources\OrganizationResource($org)], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }
}
