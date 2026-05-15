<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Manage\StoreEventRequest;
use App\Http\Requests\Manage\UpdateEventRequest;
use App\Http\Requests\Manage\UpdateOrgProfileRequest;
use App\Http\Requests\Manage\VerifySearchRequest;
use App\Http\Requests\Manage\SyncRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManageController extends Controller
{
    public function dashboard(Request $req)
    {
        $user = $req->user();
        // fetch orgs where user is officer
        $org = DB::table('org_officers')->where('user_id', $user->id)->where('is_active',1)->first();
        if (!$org) return response()->json(['success' => false, 'error' => 'Officer organization not found.'], 404);
        $events = DB::table('v_event_dashboard')->where('org_name', DB::table('organizations')->where('id', $org->org_id)->value('name'))->get();
        return response()->json(['success' => true, 'data' => $events]);
    }

    public function orgProfile(Request $req)
    {
        $user = $req->user();
        $orgRow = DB::table('org_officers')->where('user_id', $user->id)->where('is_active',1)->first();
        if (!$orgRow) return response()->json(['success' => false, 'error' => 'Org not found'], 404);
        $org = DB::table('organizations')->where('id', $orgRow->org_id)->first();
        $officers = DB::table('org_officers')->where('org_id', $org->id)->get();
        return response()->json(['success' => true, 'data' => ['org' => $org, 'officers' => $officers]]);
    }

    public function updateOrgProfile(UpdateOrgProfileRequest $req)
    {
        $user = $req->user();
        $orgRow = DB::table('org_officers')->where('user_id', $user->id)->where('is_active',1)->first();
        if (!$orgRow) return response()->json(['success' => false, 'error' => 'Org not found'], 404);
        $data = $req->only(['name','description','logo_url','adviser']);
        DB::table('organizations')->where('id', $orgRow->org_id)->update(array_merge($data, ['updated_at' => now()]));
        return response()->json(['success' => true]);
    }

    public function createEvent(StoreEventRequest $req)
    {
        $user = $req->user();
        $orgRow = DB::table('org_officers')->where('user_id', $user->id)->where('is_active',1)->first();
        if (!$orgRow) return response()->json(['success' => false, 'error' => 'Org not found'], 404);
        $payload = $req->only(['venue_id','category_id','title','banner_url','description','start_date','end_date','capacity','audience_type','is_paid','payment_instructions','status']);
        $id = (string) \Illuminate\Support\Str::uuid();
        $payload = array_merge($payload, ['id' => $id, 'host_org_id' => $orgRow->org_id, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('events')->insert($payload);
        return response()->json(['success' => true, 'data' => ['id' => $id]]);
    }

    public function updateEvent(UpdateEventRequest $req, $id)
    {
        $user = $req->user();
        $orgRow = DB::table('org_officers')->where('user_id', $user->id)->where('is_active',1)->first();
        $event = DB::table('events')->where('id', $id)->first();
        if (!$event) return response()->json(['success' => false, 'error' => 'Event not found'], 404);
        if ($event->host_org_id !== $orgRow->org_id) return response()->json(['success' => false, 'error' => 'Forbidden'], 403);
        $data = $req->only(['venue_id','category_id','title','banner_url','description','start_date','end_date','capacity','audience_type','is_paid','payment_instructions','status']);
        DB::table('events')->where('id', $id)->update(array_merge($data, ['updated_at' => now()]));
        return response()->json(['success' => true]);
    }

    public function deleteEvent(Request $req, $id)
    {
        $user = $req->user();
        $orgRow = DB::table('org_officers')->where('user_id', $user->id)->where('is_active',1)->first();
        $event = DB::table('events')->where('id', $id)->first();
        if (!$event) return response()->json(['success' => false, 'error' => 'Event not found'], 404);
        if ($event->host_org_id !== $orgRow->org_id) return response()->json(['success' => false, 'error' => 'Forbidden'], 403);
        DB::table('events')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function participants(Request $req, $event_id)
    {
        $filter = $req->query('filter', 'all');
        $q = DB::table('registrations as r')
            ->join('users as u', 'r.user_id', '=', 'u.id')
            ->leftJoin('payment_proofs as p', 'r.id', '=', 'p.reg_id')
            ->where('r.event_id', $event_id)
            ->select('r.*', 'u.school_id', 'u.first_name', 'u.last_name', 'p.status as proof_status');
        if ($filter === 'proof_review') $q->where('p.status', 'Pending_Review');
        if ($filter === 'pending') $q->where('r.payment_status', 'Pending');
        $res = $q->get();
        return response()->json(['success' => true, 'data' => $res]);
    }

    public function approveProof(Request $req, $reg_id)
    {
        DB::beginTransaction();
        try {
            $proof = DB::table('payment_proofs')->where('reg_id', $reg_id)->first();
            if (!$proof) {
                DB::rollBack();
                return response()->json(['success' => false, 'error' => 'Proof not found'], 404);
            }
            DB::table('payment_proofs')->where('id', $proof->id)->update(['status' => 'Approved', 'verified_by' => $req->user()->id, 'updated_at' => now()]);
            DB::table('registrations')->where('id', $reg_id)->update(['payment_status' => 'Paid', 'updated_at' => now()]);
            DB::table('notifications')->insert(['id' => (string) \Illuminate\Support\Str::uuid(), 'user_id' => DB::table('registrations')->where('id', $reg_id)->value('user_id'), 'type' => 'Payment_Success', 'reference_id' => $reg_id, 'message' => 'Your payment has been approved.', 'sent_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function rejectProof(Request $req, $reg_id)
    {
        try {
            $proof = DB::table('payment_proofs')->where('reg_id', $reg_id)->first();
            if (!$proof) return response()->json(['success' => false, 'error' => 'Proof not found'], 404);
            DB::table('payment_proofs')->where('id', $proof->id)->update(['status' => 'Rejected', 'updated_at' => now()]);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function verifySearch(VerifySearchRequest $req, $event_id)
    {
        $query = $req->input('query');
        $reg = DB::table('registrations as r')
            ->join('users as u', 'r.user_id', '=', 'u.id')
            ->where('r.event_id', $event_id)
            ->where(function($q) use ($query) {
                $q->where('u.school_id', $query)->orWhere('u.first_name', 'like', "%$query%")->orWhere('u.last_name', 'like', "%$query%");
            })
            ->select('r.*', 'u.school_id','u.first_name','u.last_name')
            ->first();
        return response()->json(['success' => true, 'data' => $reg]);
    }

    public function confirmPayment(Request $req, $event_id, $reg_id)
    {
        DB::beginTransaction();
        try {
            DB::table('registrations')->where('id', $reg_id)->update(['payment_status' => 'Paid', 'updated_at' => now()]);
            DB::table('notifications')->insert(['id' => (string) \Illuminate\Support\Str::uuid(), 'user_id' => DB::table('registrations')->where('id', $reg_id)->value('user_id'), 'type' => 'Payment_Success', 'reference_id' => $reg_id, 'message' => 'Your payment has been confirmed.', 'sent_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function checkin(Request $req, $event_id, $reg_id)
    {
        try {
            DB::table('registrations')->where('id', $reg_id)->update(['attendance_status' => 'Checked_In', 'check_in_at' => now(), 'updated_at' => now()]);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function sync(SyncRequest $req, $event_id)
    {
        $items = $req->input('items', []);
        DB::beginTransaction();
        try {
            foreach ($items as $it) {
                $queueId = $it['id'] ?? null;
                $action = $it['action_type'] ?? null;
                $regId = $it['reg_id'] ?? null;
                if (!$queueId || !$action || !$regId) continue;
                if ($action === 'Verify_Payment') {
                    DB::table('registrations')->where('id', $regId)->update(['payment_status' => 'Paid', 'updated_at' => now()]);
                } elseif ($action === 'Check_In') {
                    DB::table('registrations')->where('id', $regId)->update(['attendance_status' => 'Checked_In', 'check_in_at' => now(), 'updated_at' => now()]);
                }
                DB::table('attendance_queue')->where('id', $queueId)->update(['sync_status' => 'Synced', 'updated_at' => now()]);
            }
            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Sync failed.'], 500);
        }
    }
}
