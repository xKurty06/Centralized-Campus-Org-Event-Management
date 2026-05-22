<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Scoped Authorization/ACL mapping table.
 * - ACCESS CONTROL RULE: Grants high-tier executive actions (`/manage` dashboard endpoints) scoped to a specific Organization ID.
 * - ARCHITECTURE CONTEXT: A single user can possess 'Officer' scope context inside Org A while remaining a generic 'User' in Org B.
 * - RETENTION POLICIES: `is_active = false` flags retired or graduated officers to preserve historical governance tracking.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('org_officers', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->char('id', 36)->primary();
            $table->char('user_id', 36);
            $table->char('org_id', 36);

            $table->string('position', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('org_id')->references('id')->on('organizations')->onDelete('cascade');

            $table->unique(['user_id', 'org_id'], 'uq_officer');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('org_officers');
    }
};
