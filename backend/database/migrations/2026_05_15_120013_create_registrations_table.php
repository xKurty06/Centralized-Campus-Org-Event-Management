<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Relational junction connecting unique users to scheduled event timelines.
 * - STATE ROUTING: Essential structural anchor for the Entrance Panel tracking array.
 * - INTEGRATION NOTE: For free events, backend logic sets `payment_status = 'Paid'` automatically at runtime.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->uuid('user_id');
            $table->timestamp('reg_date')->useCurrent();

            // Selected fulfillment pathways
            $table->enum('payment_selection', ['Online', 'On-site', 'N/A'])->default('N/A');
            $table->enum('payment_status', ['Pending', 'Paid'])->default('Pending');

            // Attendance terminal verification metrics
            $table->enum('attendance_status', ['Not_Arrived', 'Checked_In'])->default('Not_Arrived');
            $table->timestamp('check_in_at')->nullable(); // Populated during active hardware/ticket processing sweeps

            $table->timestamps();

            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
