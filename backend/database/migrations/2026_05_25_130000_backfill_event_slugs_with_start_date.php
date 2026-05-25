<?php

use App\Support\RouteKeyResolver;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('events')
            ->select('id', 'title', 'start_date')
            ->orderBy('created_at')
            ->get()
            ->each(function (object $event): void {
                $title = trim((string) ($event->title ?? 'event'));
                $startDate = trim((string) ($event->start_date ?? ''));

                DB::table('events')
                    ->where('id', $event->id)
                    ->update([
                        'slug' => RouteKeyResolver::uniqueSlug(
                            'events',
                            $title . ' ' . $startDate,
                            (string) $event->id
                        ),
                    ]);
            });
    }

    public function down(): void
    {
        // Intentionally left blank: this is a data backfill migration.
    }
};
