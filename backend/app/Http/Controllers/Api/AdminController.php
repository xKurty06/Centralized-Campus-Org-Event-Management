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
use App\Support\RouteKeyResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    private function deleteOrganizationLogoFromStorage(?string $logoUrl): void
    {
        if (!$logoUrl) {
            return;
        }

        $path = parse_url($logoUrl, PHP_URL_PATH);
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

        if (!str_starts_with($relativePath, 'organization_logos/')) {
            return;
        }

        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }

    private function writeAudit(
        Request $req,
        string $category,
        string $action,
        string $targetLabel,
        string $targetId,
        ?string $meta = null
    ): void {
        $actor = $req->user();
        if (!$actor) return;

        DB::table('audit_logs')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'actor_id' => $actor->id,
            'actor_name' => trim(($actor->first_name ?? '') . ' ' . ($actor->last_name ?? '')) ?: 'Unknown',
            'actor_school_id' => $actor->school_id ?? '',
            'actor_role' => (($actor->global_role ?? 'User') === 'Overseer') ? 'Overseer' : 'Officer',
            'category' => $category,
            'action' => $action,
            'target_label' => $targetLabel,
            'target_id' => $targetId,
            'meta' => $meta,
            'timestamp' => now(),
        ]);
    }
    public function createOrg(StoreOrgRequest $req)
    {
        try {
            $data = $req->validated();
            $id = (string) \Illuminate\Support\Str::uuid();
            $logoUrl = $data['logo_url'] ?? null;
            if ($req->hasFile('logo_file')) {
                $path = $req->file('logo_file')->storePublicly('organization_logos', 'public');
                $logoUrl = Storage::url($path);
            }

            DB::transaction(function () use ($req, $data, $id, $logoUrl) {
                DB::table('organizations')->insert([
                    'id' => $id,
                    'name' => $data['name'],
                    'code_name' => $data['code_name'],
                    'slug' => RouteKeyResolver::uniqueSlug('organizations', (string) $data['name']),
                    'description' => $data['description'] ?? null,
                    'logo_url' => $logoUrl,
                    'adviser' => $data['adviser'] ?? null,
                    'founded_date' => $data['founded_date'] ?? null,
                    'category_id' => $data['category_id'],
                    'accreditation_status' => $data['accreditation_status'] ?? 'Active',
                    'accredited_by' => $req->user()->id,
                    'accredited_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $officers = $data['officers'] ?? [];
                if (!empty($officers)) {
                    $schoolIds = array_values(array_unique(array_map(fn($o) => trim((string) $o['school_id']), $officers)));
                    $usersBySchoolId = DB::table('users')
                        ->whereIn('school_id', $schoolIds)
                        ->where('is_active', 1)
                        ->pluck('id', 'school_id');

                    $rows = [];
                    foreach ($officers as $officer) {
                        $schoolId = trim((string) $officer['school_id']);
                        $userId = $usersBySchoolId[$schoolId] ?? null;
                        if (!$userId) {
                            continue;
                        }

                        $rows[] = [
                            'id' => (string) \Illuminate\Support\Str::uuid(),
                            'user_id' => $userId,
                            'org_id' => $id,
                            'position' => trim((string) $officer['position']),
                            'is_active' => 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }

                    if (!empty($rows)) {
                        DB::table('org_officers')->insert($rows);
                    }
                }
            });

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
            $orgs    = DB::table('organizations as o')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->select('o.*', 'c.name as category_name')
                ->latest('o.created_at')
                ->paginate($perPage);

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
            $orgId = RouteKeyResolver::resolveOrganizationId($id);
            if (!$orgId) {
                return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            }
            $org = DB::table('organizations as o')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->leftJoin('users as u', 'o.accredited_by', '=', 'u.id')
                ->select(
                    'o.*',
                    'c.name as category_name',
                    DB::raw("CONCAT(u.first_name, ' ', u.last_name) as accredited_by_name")
                )
                ->where('o.id', $orgId)
                ->first();
            if (!$org) {
                return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            }

            $officers = DB::table('org_officers as oo')
                ->leftJoin('users as u', 'oo.user_id', '=', 'u.id')
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
                    'u.email'
                )
                ->where('oo.org_id', $orgId)
                ->orderByDesc('oo.is_active')
                ->orderBy('u.last_name')
                ->orderBy('u.first_name')
                ->get();

            $members = DB::table('org_members as om')
                ->join('users as u', 'om.user_id', '=', 'u.id')
                ->select(
                    'om.id',
                    'om.user_id',
                    'om.org_id',
                    'om.membership_status',
                    'om.paid_membership_fee',
                    'om.joined_at',
                    'om.created_at',
                    'u.first_name',
                    'u.last_name',
                    'u.school_id',
                    'u.email'
                )
                ->where('om.org_id', $orgId)
                ->orderByDesc('om.joined_at')
                ->get();

            $memberGrowth = DB::table('org_members')
                ->select(
                    DB::raw("DATE_FORMAT(COALESCE(joined_at, created_at), '%Y-%m') as month_key"),
                    DB::raw('COUNT(*) as joined_count')
                )
                ->where('org_id', $orgId)
                ->groupBy('month_key')
                ->orderBy('month_key')
                ->limit(12)
                ->get()
                ->map(function ($row) {
                    return [
                        'month' => $row->month_key,
                        'joined_count' => (int) $row->joined_count,
                    ];
                });
            $events   = DB::table('events')->where('host_org_id', $orgId)->get();

            return response()->json([
                'success' => true,
                'data'    => [
                    'org'      => new OrganizationResource($org),
                    'officers' => OrgOfficerResource::collection($officers),
                    'members'  => $members,
                    'member_growth' => $memberGrowth,
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
            $orgId = RouteKeyResolver::resolveOrganizationId($id);
            if (!$orgId) {
                return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            }
            // Gate::authorize() works without the AuthorizesRequests trait.
            // Throws AuthorizationException (403) if the policy denies access.
            Gate::authorize('update', \App\Models\Organization::findOrFail($orgId));

            $status = $req->input('accreditation_status');

            $previousOrg = DB::table('organizations')->where('id', $orgId)->first();
            $reason = $req->input('reason');

            DB::table('organizations')->where('id', $orgId)->update([
                'accreditation_status' => $status,
                'accredited_by' => $req->user()->id,
                'accredited_at' => now(),
                'updated_at'    => now(),
            ]);

            $org = DB::table('organizations as o')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->leftJoin('users as u', 'o.accredited_by', '=', 'u.id')
                ->select(
                    'o.*',
                    'c.name as category_name',
                    DB::raw("CONCAT(u.first_name, ' ', u.last_name) as accredited_by_name")
                )
                ->where('o.id', $orgId)
                ->first();
            $actionLabel = $status === 'Active' ? 'Restore Accreditation' : 'Suspend Organization';
            $meta = json_encode([
                'previous_status' => $previousOrg->accreditation_status ?? null,
                'reason' => $reason,
            ]);
            $this->writeAudit(
                $req,
                'Accreditation',
                $actionLabel,
                $org->name ?? $previousOrg->name ?? 'Organization',
                $orgId,
                $meta,
            );

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
            $orgId = RouteKeyResolver::resolveOrganizationId($id);
            if (!$orgId) {
                return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            }
            Gate::authorize('update', \App\Models\Organization::findOrFail($orgId));

            $data = $req->only(['name', 'description', 'logo_url', 'adviser', 'category_id']);
            $currentOrg = DB::table('organizations')->select('logo_url')->where('id', $orgId)->first();

            if ($req->hasFile('logo_file')) {
                $this->deleteOrganizationLogoFromStorage($currentOrg->logo_url ?? null);
                $path = $req->file('logo_file')->storePublicly('organization_logos', 'public');
                $data['logo_url'] = Storage::url($path);
            }

            if ($req->filled('name')) {
                $data['slug'] = RouteKeyResolver::uniqueSlug('organizations', (string) $req->input('name'), $orgId);
            }
            DB::table('organizations')
                ->where('id', $orgId)
                ->update(array_merge($data, ['updated_at' => now()]));

            $org = DB::table('organizations as o')
                ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
                ->leftJoin('users as u', 'o.accredited_by', '=', 'u.id')
                ->select(
                    'o.*',
                    'c.name as category_name',
                    DB::raw("CONCAT(u.first_name, ' ', u.last_name) as accredited_by_name")
                )
                ->where('o.id', $orgId)
                ->first();

            return response()->json(['success' => true, 'data' => new OrganizationResource($org)]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function addOfficer(Request $req, string $id)
    {
        try {
            $orgId = RouteKeyResolver::resolveOrganizationId($id);
            if (!$orgId) {
                return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            }
            Gate::authorize('update', \App\Models\Organization::findOrFail($orgId));

            $data = $req->validate([
                'user_id' => ['required', 'uuid'],
                'position' => ['required', 'string', 'max:120'],
            ]);

            $user = DB::table('users')
                ->where('id', $data['user_id'])
                ->where('is_active', 1)
                ->first();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not found or inactive.'], 404);
            }

            $existing = DB::table('org_officers')
                ->where('org_id', $orgId)
                ->where('user_id', $data['user_id'])
                ->first();

            if ($existing) {
                DB::table('org_officers')
                    ->where('id', $existing->id)
                    ->update([
                        'position' => trim((string) $data['position']),
                        'is_active' => 1,
                        'updated_at' => now(),
                    ]);
                $officerId = $existing->id;
            } else {
                $officerId = (string) \Illuminate\Support\Str::uuid();
                DB::table('org_officers')->insert([
                    'id' => $officerId,
                    'org_id' => $orgId,
                    'user_id' => $data['user_id'],
                    'position' => trim((string) $data['position']),
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $targetLabel = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Officer';
            $meta = json_encode([
                'org_id' => $orgId,
                'position' => trim((string) $data['position']),
                'user_id' => $data['user_id'],
                'user_school_id' => $user->school_id ?? null,
                'user_email' => $user->email ?? null,
            ]);
            $this->writeAudit($req, 'Officer', 'Add Officer', $targetLabel, $officerId, $meta);

            return response()->json(['success' => true], 201);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['success' => false, 'error' => 'Forbidden.'], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'error' => 'Invalid payload.', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function removeOfficer(Request $req, string $orgId, string $officerId)
    {
        try {
            $resolvedOrgId = RouteKeyResolver::resolveOrganizationId($orgId);
            if (!$resolvedOrgId) {
                return response()->json(['success' => false, 'error' => 'Organization not found.'], 404);
            }
            Gate::authorize('update', \App\Models\Organization::findOrFail($resolvedOrgId));

            $officer = DB::table('org_officers as oo')
                ->leftJoin('users as u', 'oo.user_id', '=', 'u.id')
                ->leftJoin('organizations as o', 'oo.org_id', '=', 'o.id')
                ->select(
                    'oo.id as officer_id',
                    'oo.org_id',
                    'oo.user_id',
                    'oo.position',
                    'oo.is_active',
                    'u.first_name',
                    'u.last_name',
                    'u.school_id',
                    'u.email',
                    'o.name as org_name'
                )
                ->where('oo.id', $officerId)
                ->where('oo.org_id', $resolvedOrgId)
                ->first();

            if (!$officer) {
                return response()->json(['success' => false, 'error' => 'Officer not found.'], 404);
            }

            if (!$officer->is_active) {
                return response()->json(['success' => false, 'error' => 'Officer is already removed.'], 400);
            }

            $reason = trim((string) $req->input('reason', ''));
            if ($reason === '') {
                return response()->json(['success' => false, 'error' => 'Removal reason is required.'], 422);
            }

            DB::table('org_officers')
                ->where('id', $officerId)
                ->delete();

            $targetLabel = trim(($officer->first_name ?? '') . ' ' . ($officer->last_name ?? '')) ?: 'Officer';
            $meta = json_encode([
                'reason' => $reason,
                'org_id' => $resolvedOrgId,
                'org_name' => $officer->org_name,
                'position' => $officer->position,
                'user_id' => $officer->user_id,
                'user_school_id' => $officer->school_id,
                'user_email' => $officer->email,
            ]);

            $this->writeAudit(
                $req,
                'Officer',
                'Remove Officer',
                $targetLabel,
                $officerId,
                $meta,
            );

            return response()->json(['success' => true]);
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
            $query = DB::table('events as e')
                ->leftJoin('event_categories as ec', 'e.category_id', '=', 'ec.id')
                ->leftJoin('venues as v', 'e.venue_id', '=', 'v.id')
                ->leftJoin('organizations as o', 'e.host_org_id', '=', 'o.id')
                ->select(
                    'e.*',
                    'ec.name as category_name',
                    'v.name as venue_name',
                    'o.name as organization_name',
                    DB::raw('(select count(*) from registrations r where r.event_id = e.id) as total_registered')
                )
                ->latest('e.created_at');

            $events = $query->paginate($perPage);

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
            $reason = trim((string) $req->input('reason', ''));
            if ($reason === '') {
                return response()->json(['success' => false, 'error' => 'Removal reason is required.'], 422);
            }

            // Pass a real Eloquent model so the policy receives a properly typed instance.
            Gate::authorize('delete', \App\Models\Event::findOrFail($id));

            DB::table('events')->where('id', $id)->delete();
            $this->writeAudit(
                $req,
                'Event',
                'Remove Event',
                (string) ($event->title ?? 'Untitled Event'),
                (string) $id,
                json_encode([
                    'reason' => $reason,
                    'status' => $event->status ?? null,
                    'host_org_id' => $event->host_org_id ?? null,
                ])
            );

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
            $users = DB::table('users as u')
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->leftJoin('courses as c', 'u.course_id', '=', 'c.id')
                ->select(
                    'u.id',
                    'u.school_id',
                    'u.email',
                    'u.first_name',
                    'u.last_name',
                    'u.dept_id',
                    'u.course_id',
                    'u.year_level',
                    'u.section',
                    'u.global_role',
                    'u.is_active',
                    'd.code as dept_code',
                    'c.course_code'
                )
                ->orderBy('school_id')
                ->paginate($perPage);

            $userIds = collect($users->items())->pluck('id')->all();
            $rolesByUser = [];
            if (!empty($userIds)) {
                $officerRows = DB::table('org_officers as oo')
                    ->join('organizations as o', 'oo.org_id', '=', 'o.id')
                    ->whereIn('oo.user_id', $userIds)
                    ->where('oo.is_active', 1)
                    ->select('oo.user_id', 'oo.position', 'o.code_name')
                    ->get();

                foreach ($officerRows as $row) {
                    $rolesByUser[$row->user_id][] = trim(($row->position ?? 'Officer') . ' @ ' . ($row->code_name ?? 'ORG'));
                }
            }

            $data = collect($users->items())->map(function ($u) use ($rolesByUser) {
                return [
                    'id' => $u->id,
                    'school_id' => $u->school_id,
                    'email' => $u->email,
                    'first_name' => $u->first_name,
                    'last_name' => $u->last_name,
                    'dept_id' => $u->dept_id,
                    'dept_code' => $u->dept_code,
                    'course_id' => $u->course_id,
                    'course_code' => $u->course_code,
                    'year_level' => $u->year_level,
                    'section' => $u->section,
                    'global_role' => $u->global_role,
                    'is_active' => (bool) $u->is_active,
                    'org_roles' => $rolesByUser[$u->id] ?? [],
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data'    => $data,
                'meta'    => [
                    'total'        => $users->total(),
                    'per_page'     => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page'    => $users->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Admin users fetch failed.', ['exception' => $e]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function lookupUserBySchoolId(Request $req)
    {
        try {
            $schoolId = trim((string) $req->query('school_id', ''));
            if ($schoolId === '') {
                return response()->json(['success' => false, 'error' => 'school_id is required.'], 422);
            }
            if (!preg_match('/^\d{9}$/', $schoolId)) {
                return response()->json(['success' => false, 'error' => 'Student ID must be exactly 9 digits.'], 422);
            }

            $user = DB::table('users as u')
                ->leftJoin('courses as c', 'u.course_id', '=', 'c.id')
                ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
                ->whereRaw('TRIM(u.school_id) = ?', [$schoolId])
                ->where('u.is_active', 1)
                ->select(
                    'u.id',
                    'u.school_id',
                    'u.first_name',
                    'u.last_name',
                    'u.email',
                    'u.course_id',
                    'u.dept_id',
                    'u.year_level',
                    'u.section',
                    'c.course_code',
                    'c.course_name as course',
                    'd.code as dept_code',
                    'd.name as dept'
                )
                ->first();

            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not found.'], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $user->id,
                    'school_id' => $user->school_id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'course_id' => $user->course_id,
                    'course_code' => $user->course_code ?? null,
                    'course' => $user->course ?? null,
                    'dept_id' => $user->dept_id,
                    'dept_code' => $user->dept_code ?? null,
                    'dept' => $user->dept ?? null,
                    'year_level' => $user->year_level,
                    'section' => $user->section,
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

            DB::table('users')->where('id', $id)->update(['is_active' => 0]);

            $updated = DB::table('users')->where('id', $id)->first();
            $this->writeAudit(
                $req,
                'User',
                'Deactivated Account',
                trim(($updated->first_name ?? '') . ' ' . ($updated->last_name ?? '')) . ' (' . ($updated->school_id ?? '') . ')',
                (string) $updated->id,
                $req->input('reason') ? ('Reason: ' . $req->input('reason')) : null
            );

            return response()->json(['success' => true, 'data' => $updated]);
        } catch (\Exception $e) {
            Log::error('Admin deactivate user failed.', ['user_id' => $id, 'exception' => $e]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function reactivateUser(Request $req, string $id)
    {
        try {
            $user = DB::table('users')->where('id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not found.'], 404);
            }

            DB::table('users')->where('id', $id)->update(['is_active' => 1]);
            $updated = DB::table('users')->where('id', $id)->first();
            $this->writeAudit(
                $req,
                'User',
                'Reactivated Account',
                trim(($updated->first_name ?? '') . ' ' . ($updated->last_name ?? '')) . ' (' . ($updated->school_id ?? '') . ')',
                (string) $updated->id
            );

            return response()->json(['success' => true, 'data' => $updated]);
        } catch (\Exception $e) {
            Log::error('Admin reactivate user failed.', ['user_id' => $id, 'exception' => $e]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function audit(Request $req)
    {
        try {
            $perPage = (int) $req->query('per_page', 50);
            $rows = DB::table('audit_logs')
                ->orderByDesc('timestamp')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $rows->items(),
                'meta' => [
                    'total' => $rows->total(),
                    'per_page' => $rows->perPage(),
                    'current_page' => $rows->currentPage(),
                    'last_page' => $rows->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Admin audit fetch failed.', ['exception' => $e]);
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
            ]);

            $updated = DB::table('users')->where('id', $id)->first();
            $this->writeAudit(
                $req,
                'User',
                'Assigned Global Role',
                trim(($updated->first_name ?? '') . ' ' . ($updated->last_name ?? '')) . ' (' . ($updated->school_id ?? '') . ')',
                (string) $updated->id,
                'global_role: ' . ($user->global_role ?? 'User') . ' -> ' . ($updated->global_role ?? 'User')
            );

            return response()->json(['success' => true, 'data' => $updated]);
        } catch (\Exception $e) {
            Log::error('Admin update user role failed.', ['user_id' => $id, 'exception' => $e]);
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }
}
