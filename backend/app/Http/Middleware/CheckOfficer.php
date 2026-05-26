<?php

namespace App\Http\Middleware;

use App\Support\RouteKeyResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckOfficer
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthorized.'], 401);
        }

        $orgId = $request->route('org_id') ?? $request->input('org_id');
        $selectedOrgId = trim((string) ($request->header('X-Manage-Org-Id') ?? $request->query('org_id') ?? $request->input('org_id') ?? ''));
        $selectedOrgId = $selectedOrgId !== '' ? $selectedOrgId : null;
        $eventId = $request->route('event_id') ?? $request->route('id');
        $regId = $request->route('reg_id');

        if (!$orgId && $eventId) {
            $resolvedEventId = RouteKeyResolver::resolveEventId((string) $eventId);
            if ($resolvedEventId) {
                $orgId = DB::table('events')->where('id', $resolvedEventId)->value('host_org_id');
            }
        }

        if (!$orgId && $regId) {
            $orgId = DB::table('registrations as r')
                ->join('events as e', 'r.event_id', '=', 'e.id')
                ->where('r.id', $regId)
                ->value('e.host_org_id');
        }

        if (!$orgId) {
            if ($selectedOrgId) {
                $isSelectedOfficer = DB::table('org_officers')
                    ->where('user_id', $user->id)
                    ->where('org_id', $selectedOrgId)
                    ->where('is_active', 1)
                    ->exists();

                if (!$isSelectedOfficer) {
                    return response()->json(['success' => false, 'error' => 'Forbidden. Officer access required for the selected organization.'], 403);
                }
            }

            $hasOfficer = DB::table('org_officers')
                ->where('user_id', $user->id)
                ->where('is_active', 1)
                ->exists();
            if (!$hasOfficer) {
                return response()->json(['success' => false, 'error' => 'Forbidden. Officer access required.'], 403);
            }
            return $next($request);
        }

        if ($selectedOrgId && $selectedOrgId !== $orgId) {
            return response()->json(['success' => false, 'error' => 'Forbidden. Request does not match selected organization context.'], 403);
        }

        $isOfficer = DB::table('org_officers')
            ->where('user_id', $user->id)
            ->where('org_id', $orgId)
            ->where('is_active', 1)
            ->exists();

        if (!$isOfficer) {
            return response()->json(['success' => false, 'error' => 'Forbidden. Officer access required for this organization.'], 403);
        }

        return $next($request);
    }
}
