<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Profile data registry for verified, campus-accredited organizations.
 * - BUSINESS LOGIC RULE: `accreditation_status` acts as a feature gate. If set to 'Suspended', the organization cannot publish events.
 * - AUDIT TRAIL: `accredited_by` maps to the Overseer who executed the latest certification state shift.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description'); // Public "About Us" Markdown or plain text block
            $table->text('logo_url')->nullable(); // Storage path to branding asset
            $table->string('adviser'); // Assigned faculty handler

            // RELATION: Links group to categorical types (Academic, Non-Academic, etc.)
            $table->foreignId('category_id')->constrained('org_categories');

            // AUDIT LOG: Tracks the specific Overseer account handling accreditation changes.
            $table->uuid('accredited_by')->nullable();

            // Feature gating configuration state. Checked prior to execution of creation queries in event routers.
            $table->enum('accreditation_status', ['Active', 'Suspended'])->default('Active');

            // Track when authorization records were updated.
            $table->timestamp('accredited_at')->nullable();
            $table->timestamps();

            // Establish relationship across decoupled user mapping structure.
            $table->foreign('accredited_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
