<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Organization;
use Illuminate\Support\Facades\DB;

class OrganizationPolicy
{
    /**
     * Determine if the given organization can be updated by the user.
     */
    public function update(User $user, Organization $organization): bool
    {
        $count = DB::table('org_officers')->where('user_id', $user->id)->where('org_id', $organization->id)->where('is_active', 1)->count();
        return $count > 0;
    }
}
