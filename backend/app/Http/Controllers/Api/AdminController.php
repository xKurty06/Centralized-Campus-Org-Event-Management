<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AccreditationRequest;
use App\Http\Requests\Admin\UpdateOrgRequest;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(Request $req)
    {
        $summary = DB::table('v_event_dashboard')->select(DB::raw('COUNT(*) as total_events'), DB::raw('SUM(total_registered) as total_registrations'))->first();
        $perOrg = DB::table('v_event_dashboard')->select('org_name', DB::raw('COUNT(*) as events_count'), DB::raw('SUM(total_registered) as registrations'))->groupBy('org_name')->get();
        return response()->json(['success' => true, 'data' => ['summary' => $summary, 'per_org' => $perOrg]]);
    }

    public function organizations(Request $req)
    {
        $orgs = DB::table('organizations')->get();
        return response()->json(['success' => true, 'data' => $orgs]);
    }

    public function organization($id)
    {
        $org = DB::table('organizations')->where('id', $id)->first();
        $officers = DB::table('org_officers')->where('org_id', $id)->get();
        $events = DB::table('events')->where('host_org_id', $id)->get();
        return response()->json(['success' => true, 'data' => ['org' => $org, 'officers' => $officers, 'events' => $events]]);
    }

    public function toggleAccreditation(AccreditationRequest $req, $id)
    {
        $status = $req->input('accreditation_status');
        DB::table('organizations')->where('id', $id)->update(['accreditation_status' => $status, 'accredited_by' => $req->user()->id, 'accredited_at' => now(), 'updated_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function updateOrg(UpdateOrgRequest $req, $id)
    {
        $data = $req->only(['name','description','logo_url','adviser','category_id']);
        DB::table('organizations')->where('id', $id)->update(array_merge($data, ['updated_at' => now()]));
        return response()->json(['success' => true]);
    }

    public function events(Request $req)
    {
        $events = DB::table('v_event_dashboard')->get();
        return response()->json(['success' => true, 'data' => $events]);
    }

    public function deleteEvent(Request $req, $id)
    {
        DB::table('events')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function users(Request $req)
    {
        $users = DB::table('users')->get();
        return response()->json(['success' => true, 'data' => $users]);
    }

    public function deactivateUser(Request $req, $id)
    {
        DB::table('users')->where('id', $id)->update(['is_active' => 0, 'updated_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function updateUserRole(UpdateUserRoleRequest $req, $id)
    {
        $role = $req->input('global_role');
        DB::table('users')->where('id', $id)->update(['global_role' => $role, 'updated_at' => now()]);
        return response()->json(['success' => true]);
    }
}
