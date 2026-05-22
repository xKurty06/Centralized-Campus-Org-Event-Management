<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Get paginated notifications for the authenticated user.
     */
    public function index(Request $req)
    {
        try {
            $user = $req->user();
            $perPage = (int) $req->query('per_page', 15);
            $unreadOnly = $req->query('unread_only', false);

            $query = Notification::where('user_id', $user->id);
            if ($unreadOnly) {
                $query->where('is_read', 0);
            }

            $notifications = $query->latest()->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => NotificationResource::collection($notifications->items()),
                'meta' => [
                    'total' => $notifications->total(),
                    'per_page' => $notifications->perPage(),
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $req, $id)
    {
        try {
            $user = $req->user();
            $notification = Notification::where('id', $id)->where('user_id', $user->id)->first();

            if (!$notification) {
                return response()->json(['success' => false, 'error' => 'Notification not found.'], 404);
            }

            $notification->update(['is_read' => 1]);
            return response()->json(['success' => true], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    public function markAllAsRead(Request $req)
    {
        try {
            $user = $req->user();
            Notification::where('user_id', $user->id)->update(['is_read' => 1]);
            return response()->json(['success' => true], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong.'], 500);
        }
    }
}
