<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile.
     */
    public function show(Request $req)
    {
        try {
            $user = $req->user();
            return response()->json(['success' => true, 'data' => new UserResource($user)], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(UpdateProfileRequest $req)
    {
        try {
            $user = $req->user();
            $user->update($req->validated());
            return response()->json(['success' => true, 'data' => new UserResource($user)], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }
}
