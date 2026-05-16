<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Event;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class EventPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the given event can be updated by the user.
     */
    public function update(User $user, Event $event): bool
    {
        $orgId = $event->host_org_id;
        $count = DB::table('org_officers')->where('user_id', $user->id)->where('org_id', $orgId)->where('is_active',1)->count();
        return $count > 0;
    }

    /**
     * Determine if the given event can be deleted by the user.
     */
    public function delete(User $user, Event $event): bool
    {
        return $this->update($user, $event);
    }

    /**
     * Determine if the officer can view participants for the event.
     */
    public function viewParticipants(User $user, Event $event): bool
    {
        return $this->update($user, $event);
    }
}
