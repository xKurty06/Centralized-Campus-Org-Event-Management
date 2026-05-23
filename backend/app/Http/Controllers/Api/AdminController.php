<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AccreditationRequest;
use App\Http\Requests\Admin\StoreOrgRequest;
use App\Http\Requests\Admin\UpdateOrgRequest;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\OrgOfficerResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AdminController extends Controller
{
    public function createOrg(StoreOrgRequest $req)
    {
        try {
            $data = $req->only([
                'name',
                'code_name',
                'description',
                'logo_url',
                'adviser',
                'founded_date',
                'category_id',
                'accreditation_status',
            ]);

            $id = (string) \Illuminate\Support\Str::uuid();
            DB::table('organizations')->insert([
                'id' => $id,
                'name' => $data['name'],
                'code_name' => $data['code_name'],
                'description' => $data['description'] ?? null,
                'logo_url' => $data['logo_url'] ?? null,
                'adviser' => $data['adviser'] ?? null,
                'founded_date' => $data['founded_date'] ?? null,
                'category_id' => $data['category_id'],
                'accreditation_status' => $data['accreditation_status'] ?? 'Active',
                'accredited_by' => $req->user()->id,
                'accredited_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $org = DB::table('organizations')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new OrganizationResource($org)], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function dashboard(Request $req)
    {
        try {
            $summary = DB::table('events')
                ->select(
                    DB::raw('COUNT(*) as total_events'),
                    DB::raw('COUNT(DISTINCT host_org_id) as total_orgs')
                )
                ->first();

            $topOrgs = DB::table('events as e')
                ->join('organizations as o', 'e.host_org_id', '=', 'o.id')
                ->select('o.id', 'o.name', DB::raw('COUNT(e.id) as event_count'))
                ->groupBy('o.id', 'o.name')
                ->orderByDesc('event_count')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data'    => [
                    'summary'  => $summary,
                    'top_orgs' => $topOrgs,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function organizations(Request $req)
    {
        try {
            $perPage = (int) $req->query('per_page', 15);
            $orgs    = DB::table('organizations')->latest()->paginate($perPage);

            return response()->json([
                'success' => true,
                'data'    => OrganizationResource::collection($orgs),
                'meta'    => [
                    'total'        => $orgs->total(),
                    'per_page'     => $orgs->perPage(),
                    'current_page' => $orgs->currentPage(),
                    'last_page'    => $orgs->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function organization(string $id)
    {
        try {
            $org = DB::table('organizations')->where('id', $id)->first();
            if (!$org) {
                return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            }

            $officers = DB::table('org_officers')->where('org_id', $id)->get();
            $events   = DB::table('events')->where('host_org_id', $id)->get();

            return response()->json([
                'success' => true,
                'data'    => [
                    'org'      => new OrganizationResource($org),
                    'officers' => OrgOfficerResource::collection($officers),
                    'events'   => EventResource::collection($events),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function toggleAccreditation(AccreditationRequest $req, string $id)
    {
        try {
            // Gate::authorize() works without the AuthorizesRequests trait.
            // Throws AuthorizationException (403) if the policy denies access.
            Gate::authorize('update', \App\Models\Organization::findOrFail($id));

            $status = $req->input('accreditation_status');

            DB::table('organizations')->where('id', $id)->update([
                'accreditation_status' => $status,
                'is_accredited' => $status === 'Active' ? 1 : 0,
                'accredited_by' => $req->user()->id,
                'accredited_at' => now(),
                'updated_at'    => now(),
            ]);

            $org = DB::table('organizations')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new OrganizationResource($org)]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function updateOrg(UpdateOrgRequest $req, string $id)
    {
        try {
            Gate::authorize('update', \App\Models\Organization::findOrFail($id));

            $data = $req->only(['name', 'description', 'logo_url', 'adviser', 'category_id']);

            DB::table('organizations')
                ->where('id', $id)
                ->update(array_merge($data, ['updated_at' => now()]));

            $org = DB::table('organizations')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new OrganizationResource($org)]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function events(Request $req)
    {
        try {
            $perPage = (int) $req->query('per_page', 15);
            $events  = DB::table('events')->latest()->paginate($perPage);

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

    public function deleteEvent(Request $req, string $id)
    {
        try {
            $event = DB::table('events')->where('id', $id)->first();
            if (!$event) {
                return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            }

            // Pass a real Eloquent model so the policy receives a properly typed instance.
            Gate::authorize('delete', \App\Models\Event::findOrFail($id));

            DB::table('events')->where('id', $id)->delete();

            return response()->json(['success' => true]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function users(Request $req)
    {
        try {
            $perPage = (int) $req->query('per_page', 15);
            $users   = DB::table('users')->latest()->paginate($perPage);

            return response()->json([
                'success' => true,
                'data'    => UserResource::collection($users),
                'meta'    => [
                    'total'        => $users->total(),
                    'per_page'     => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page'    => $users->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function deactivateUser(Request $req, string $id)
    {
        try {
            $user = DB::table('users')->where('id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not found.'], 404);
            }

            DB::table('users')->where('id', $id)->update(['is_active' => 0, 'updated_at' => now()]);

            $updated = DB::table('users')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new UserResource($updated)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function updateUserRole(UpdateUserRoleRequest $req, string $id)
    {
        try {
            $user = DB::table('users')->where('id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not found.'], 404);
            }

            DB::table('users')->where('id', $id)->update([
                'global_role' => $req->input('global_role'),
                'updated_at'  => now(),
            ]);

            $updated = DB::table('users')->where('id', $id)->first();

            return response()->json(['success' => true, 'data' => new UserResource($updated)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }
}
