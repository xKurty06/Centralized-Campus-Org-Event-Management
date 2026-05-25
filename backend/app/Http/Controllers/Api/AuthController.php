<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    protected function resolveEffectiveRole(User $user): string
    {
        if ($user->global_role === 'Overseer') {
            return 'Overseer';
        }

        $hasActiveOfficerRole = DB::table('org_officers')
            ->where('user_id', $user->id)
            ->where('is_active', 1)
            ->exists();

        return $hasActiveOfficerRole ? 'Officer' : 'User';
    }

    public function authUserPayload(User $user): array
    {
        $academic = DB::table('users as u')
            ->leftJoin('departments as d', 'u.dept_id', '=', 'd.id')
            ->leftJoin('courses as c', 'u.course_id', '=', 'c.id')
            ->where('u.id', $user->id)
            ->select(
                'u.course_id',
                'u.section',
                'd.id as department_id',
                'd.code as department_code',
                'd.name as department_name',
                'c.id as course_id',
                'c.course_code',
                'c.course_name'
            )
            ->first();

        return [
            'id' => $user->id,
            'school_id' => $user->school_id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'dept_id' => $user->dept_id,
            'course_id' => $academic->course_id ?? null,
            'year_level' => $user->year_level,
            'section' => $academic->section ?? null,
            'is_active' => (bool) $user->is_active,
            'global_role' => $this->resolveEffectiveRole($user),
            'department' => [
                'id' => $academic->department_id ?? null,
                'code' => $academic->department_code ?? null,
                'name' => $academic->department_name ?? null,
            ],
            'course' => [
                'id' => $academic->course_id ?? null,
                'code' => $academic->course_code ?? null,
                'name' => $academic->course_name ?? null,
            ],
            'memberships' => $this->resolveOrgMemberships($user),
        ];
    }

    private function resolveOrgMemberships(User $user): array
    {
        $rows = DB::table('org_members as m')
            ->join('organizations as o', 'm.org_id', '=', 'o.id')
            ->leftJoin('org_categories as c', 'o.category_id', '=', 'c.id')
            ->leftJoin('org_officers as oo', function ($join) use ($user) {
                $join->on('oo.org_id', '=', 'm.org_id')
                    ->where('oo.user_id', $user->id)
                    ->where('oo.is_active', 1);
            })
            ->where('m.user_id', $user->id)
            ->select(
                'm.id as member_id',
                'm.org_id',
                'o.name as org_name',
                'c.name as org_category',
                'o.accreditation_status',
                'm.membership_status',
                'm.paid_membership_fee',
                'm.created_at',
                'm.updated_at',
                'oo.position'
            )
            ->orderByDesc('m.created_at')
            ->get();

        return $rows->map(function ($row) {
            $category = trim((string) ($row->org_category ?? 'Non-Academic'));
            if (!in_array($category, ['Academic', 'Non-Academic', 'Religious'], true)) {
                $category = 'Non-Academic';
            }

            return [
                'org_id' => $row->org_id,
                'org_name' => $row->org_name,
                'org_category' => $category,
                'org_status' => strtolower(trim((string) ($row->accreditation_status ?? 'Active'))) === 'suspended' ? 'Suspended' : 'Active',
                'org_color' => $this->resolveOrgColor($category),
                'position' => trim((string) ($row->position ?? 'Member')) ?: 'Member',
                'paid_membership_fee' => (int) ($row->paid_membership_fee ?? 0) === 1,
                'is_active' =>
                    strtolower(trim((string) ($row->membership_status ?? 'Active'))) === 'active'
                    && (int) ($row->paid_membership_fee ?? 0) === 1,
            ];
        })->toArray();
    }

    private function resolveOrgColor(string $category): string
    {
        return match ($category) {
            'Academic' => 'bg-blue-100 text-blue-700',
            'Non-Academic' => 'bg-orange-100 text-orange-700',
            'Religious' => 'bg-purple-100 text-purple-700',
            default => 'bg-gray-100 text-gray-700',
        };
    }

    public function register(RegisterRequest $req)
    {
        try {
            $data = $req->validated();
            $result = DB::transaction(function () use ($data) {
                $user = User::create([
                    'id' => (string) Str::uuid(),
                    'school_id' => $data['school_id'],
                    'email' => $data['email'],
                    'password_hash' => Hash::make($data['password']),
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'dept_id' => $data['dept_id'],
                    'course_id' => $data['course_id'],
                    'year_level' => $data['year_level'],
                    'section' => $data['section'],
                    'global_role' => 'User',
                    'is_active' => true,
                ]);

                return [
                    'user' => $user,
                    'token' => $user->createToken('api-token')->plainTextToken,
                ];
            });

            return response()->json(['success' => true, 'data' => ['user' => new UserResource($result['user']), 'token' => $result['token']]], 201);
        } catch (\Exception $e) {
            Log::error('Registration failed.', ['exception' => $e]);

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
            return response()->json(['success' => true, 'data' => ['user' => $this->authUserPayload($user), 'token' => $token]], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function logout(Request $req)
    {
        try {
            $user = $req->user();
            $user->currentAccessToken()->delete();
            return response()->json(['success' => true], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function me(Request $req)
    {
        try {
            $user = $req->user();
            return response()->json(['success' => true, 'data' => $this->authUserPayload($user)], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function forgotPassword(ForgotPasswordRequest $req)
    {
        try {
            $status = Password::sendResetLink($req->only('email'));
            if ($status === Password::RESET_LINK_SENT) {
                return response()->json(['success' => true, 'message' => 'Reset link sent to your email.'], 200);
            }
            return response()->json(['success' => false, 'error' => 'Unable to send reset link.'], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function resetPassword(ResetPasswordRequest $req)
    {
        try {
            $status = Password::reset(
                $req->only('email', 'password', 'password_confirmation', 'token'),
                function (User $user, string $password) {
                    $user->update(['password_hash' => Hash::make($password)]);
                }
            );
            if ($status === Password::PASSWORD_RESET) {
                return response()->json(['success' => true, 'message' => 'Password reset successful.'], 200);
            }
            return response()->json(['success' => false, 'error' => 'Invalid or expired token.'], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    public function changePassword(ChangePasswordRequest $req)
    {
        try {
            $user = $req->user();
            if (!Hash::check($req->current_password, $user->password_hash)) {
                return response()->json(['success' => false, 'error' => 'Current password is incorrect.'], 400);
            }
            $user->update(['password_hash' => Hash::make($req->new_password)]);
            return response()->json(['success' => true, 'message' => 'Password updated successfully.'], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }
}
