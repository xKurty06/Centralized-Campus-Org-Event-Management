<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    /**
     * Handle an incoming request and add CORS headers.
     */
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
        ];
        $origin = $request->headers->get('Origin');
        $allowOrigin = in_array($origin, $allowedOrigins, true) ? $origin : 'http://localhost:3000';
        $allowHeaders = 'Content-Type, Authorization, Accept, X-Requested-With, X-Manage-Org-Id';

        // Handle preflight
        if ($request->getMethod() === 'OPTIONS') {
            $headers = [
                'Access-Control-Allow-Origin' => $allowOrigin,
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => $allowHeaders,
                'Access-Control-Allow-Credentials' => 'true',
            ];
            return response()->json('OK', 200, $headers);
        }

        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', $allowOrigin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', $allowHeaders);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}
