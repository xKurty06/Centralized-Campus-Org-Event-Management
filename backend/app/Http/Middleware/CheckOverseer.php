<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckOverseer
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || ($user->global_role ?? null) !== 'Overseer') {
            return response()->json(['success' => false, 'error' => 'Forbidden. Overseer role required.'], 403);
        }
        return $next($request);
    }
}
