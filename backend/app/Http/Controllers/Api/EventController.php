<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\RegisterEventRequest;
use App\Http\Requests\Event\PaymentUploadRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index(Request $req)
    {
        try {
            $query = DB::table('v_event_dashboard as v')
                ->leftJoin('events as e', 'v.event_id', '=', 'e.id');

            if ($req->filled('org_id')) {
                $query->where('e.host_org_id', $req->org_id);
            }
            if ($req->filled('category_id')) {
                $query->where('e.category_id', $req->category_id);
            }
            if ($req->filled('venue_id')) {
                $query->where('e.venue_id', $req->venue_id);
            }
            if ($req->filled('audience_type')) {
                $query->where('v.audience_type', $req->audience_type);
            }

            $events = $query->select('v.*')->get();
            return response()->json(['success' => true, 'data' => $events]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function show($id)
    {
        try {
            $event = DB::table('events')->where('id', $id)->first();
            if (!$event) return response()->json(['success' => false, 'error' => 'Event not found.'], 404);
            $org = DB::table('organizations')->where('id', $event->host_org_id)->first();
            $venue = DB::table('venues')->where('id', $event->venue_id)->first();
            $category = DB::table('event_categories')->where('id', $event->category_id)->first();
            $counts = DB::table('registrations')->where('event_id', $id)->select(DB::raw("COUNT(*) as total"), DB::raw("SUM(payment_status='Paid') as confirmed"))->first();
            $data = ['event' => $event, 'org' => $org, 'venue' => $venue, 'category' => $category, 'counts' => $counts];
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function myEvents(Request $req)
    {
        try {
            $user = $req->user();
            $regs = DB::table('registrations as r')
                ->join('events as e', 'r.event_id', '=', 'e.id')
                ->where('r.user_id', $user->id)
                ->select('r.*', 'e.end_date')
                ->get();
            $upcoming = $regs->where('end_date', '>', now());
            $past = $regs->where('end_date', '<=', now());
            return response()->json(['success' => true, 'data' => ['upcoming' => $upcoming, 'past' => $past]]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }

    public function register(RegisterEventRequest $req, $id)
    {
        try {
            $user = $req->user();
            $payment_selection = $req->input('payment_selection', 'N/A');
            DB::beginTransaction();
            DB::select('CALL register_student_for_event(?, ?, ?)', [$id, $user->id, $payment_selection]);
            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            $msg = $e->getMessage();
            return response()->json(['success' => false, 'error' => $msg ?: 'Registration failed.'], 400);
        }
    }

    public function paymentUpload(PaymentUploadRequest $req, $id)
    {
        try {
            $user = $req->user();
            $file = $req->file('image');
            if (!$file) return response()->json(['success' => false, 'error' => 'No file uploaded.'], 400);
            $path = $file->store('payment_proofs');
            $reg = DB::table('registrations')->where('event_id', $id)->where('user_id', $user->id)->first();
            if (!$reg) return response()->json(['success' => false, 'error' => 'Registration not found.'], 404);
            $proof = DB::table('payment_proofs')->where('reg_id', $reg->id)->first();
            if ($proof) {
                DB::table('payment_proofs')->where('id', $proof->id)->update(['image_url' => $path, 'uploaded_at' => now(), 'status' => 'Pending_Review', 'updated_at' => now()]);
            } else {
                DB::table('payment_proofs')->insert(['id' => (string) \Illuminate\Support\Str::uuid(), 'reg_id' => $reg->id, 'image_url' => $path, 'uploaded_at' => now(), 'status' => 'Pending_Review', 'created_at' => now(), 'updated_at' => now()]);
            }
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }
}
