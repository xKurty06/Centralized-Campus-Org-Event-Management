<?php

use App\Support\RouteKeyResolver;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->string('slug', 220)->nullable()->unique()->after('code_name');
        });

        Schema::table('events', function (Blueprint $table): void {
            $table->string('slug', 220)->nullable()->unique()->after('title');
        });

        DB::table('organizations')
            ->select('id', 'name')
            ->orderBy('created_at')
            ->get()
            ->each(function (object $org): void {
                DB::table('organizations')
                    ->where('id', $org->id)
                    ->update(['slug' => RouteKeyResolver::uniqueSlug('organizations', (string) $org->name)]);
            });

        DB::table('events')
            ->select('id', 'title')
            ->orderBy('created_at')
            ->get()
            ->each(function (object $event): void {
                DB::table('events')
                    ->where('id', $event->id)
                    ->update(['slug' => RouteKeyResolver::uniqueSlug('events', (string) $event->title)]);
            });

        Schema::table('organizations', function (Blueprint $table): void {
            $table->string('slug', 220)->nullable(false)->change();
        });

        Schema::table('events', function (Blueprint $table): void {
            $table->string('slug', 220)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });

        Schema::table('organizations', function (Blueprint $table): void {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
