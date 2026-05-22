<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class CheckActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && property_exists($user, 'is_active') && !$user->is_active) {
            return response()->json(['success' => false, 'error' => 'Account is deactivated.'], 403);
        }
        return $next($request);
    }
}
