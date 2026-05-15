<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Main database engine behind the Event Discovery Hub catalog.
 * - ACCESS ENFORCEMENT: `audience_type` restricts registration endpoints based on institutional data profiles.
 * - TRANSACTION RULES: If `is_paid` is true, the routing stack enforces conditional parsing requirements on payment workflows.
 * - STATE MANAGEMENT: State status uses explicit values. "Ongoing" state is calculated by query runtime checking (`start_date <= NOW() <= end_date`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('host_org_id'); // Owning organization identity

            $table->foreignId('venue_id')->constrained('venues');
            $table->foreignId('category_id')->constrained('event_categories');

            $table->string('title');
            $table->text('banner_url')->nullable(); // Storage CDN tracking path
            $table->text('description');
            $table->dateTime('start_date');
            $table->dateTime('end_date');

            // Hard gate value. Once `confirmed registrations count >= capacity`, status must automatically shift to 'Full'.
            $table->integer('capacity');

            // Accessibility boundary scopes. Verified during enrollment routines.
            $table->enum('audience_type', ['Open', 'CvSU_Only', 'Org_Members_Only'])->default('CvSU_Only');

            // Billing toggle flags.
            $table->boolean('is_paid')->default(false);
            $table->text('payment_instructions')->nullable(); // Rich parsing text data for digital or cash transactions

            // System Lifecycle status
            $table->enum('status', ['Upcoming', 'Open', 'Full', 'Closed', 'Completed', 'Cancelled'])->default('Upcoming');
            $table->timestamps();

            $table->foreign('host_org_id')->references('id')->on('organizations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
