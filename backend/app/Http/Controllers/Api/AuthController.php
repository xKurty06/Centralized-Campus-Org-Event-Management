<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $req)
    {
        try {
            $data = $req->validated();
            $user = User::create([
                'id' => (string) Str::uuid(),
                'school_id' => $data['school_id'],
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'dept_id' => $data['dept_id'],
                'year_level' => $data['year_level'],
                'global_role' => 'User',
                'is_active' => true,
            ]);

            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json(['success' => true, 'data' => ['user' => $user, 'token' => $token]]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function login(LoginRequest $req)
    {
        try {
            $creds = $req->validated();
            $user = null;
            if (!empty($creds['school_id'])) {
                $user = User::where('school_id', $creds['school_id'])->first();
            } else {
                $user = User::where('email', $creds['email'])->first();
            }

            if (!$user || !Hash::check($creds['password'], $user->password_hash)) {
                return response()->json(['success' => false, 'error' => 'Invalid credentials.'], 401);
            }

            if (!$user->is_active) {
                return response()->json(['success' => false, 'error' => 'Account is deactivated.'], 403);
            }

            $token = $user->createToken('api-token')->plainTextToken;
            return response()->json(['success' => true, 'data' => ['user' => $user, 'token' => $token]]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function logout(Request $req)
    {
        try {
            $user = $req->user();
            $user->currentAccessToken()->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function me(Request $req)
    {
        try {
            $user = $req->user();
            // Load dept and org memberships
            $user->dept = DB::table('departments')->where('id', $user->dept_id)->first();
            $user->org_memberships = DB::table('org_officers')->where('user_id', $user->id)->get();
            return response()->json(['success' => true, 'data' => $user]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }
}
