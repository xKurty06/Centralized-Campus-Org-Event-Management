<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Outage fallback queue designed to support structural operations during internet loss.
 * - LOCAL RECORD RULE: `device_timestamp` captures the true transactional event horizon logged on mobile terminals before server ingestion.
 * - SYNC FLOW: Once network resolution returns, synchronization workers loop through records matching `sync_status = 'Pending'` to update downstream structural entities.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_queue', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('reg_id'); // Targeted processing entity record
            $table->uuid('officer_id'); // Execution officer account

            // Structural tracking criteria types
            $table->enum('action_type', ['Verify_Payment', 'Check_In']);
            $table->timestamp('device_timestamp'); // Baseline evaluation matrix time tracker (Crucial for true analytics logging)

            // Sync handling states
            $table->enum('sync_status', ['Pending', 'Synced'])->default('Pending');
            $table->timestamps();

            $table->foreign('reg_id')->references('id')->on('registrations')->onDelete('cascade');
            $table->foreign('officer_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_queue');
    }
};
