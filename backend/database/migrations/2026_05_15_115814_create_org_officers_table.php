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
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // Targets identity account
            $table->uuid('org_id');  // Targets organization context where control permission applies

            $table->string('position'); // Display title (e.g., President, Secretary)

            // Security verification boolean. Deactivation immediately cuts authorization routines.
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('org_id')->references('id')->on('organizations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('org_officers');
    }
};
