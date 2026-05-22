<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Verification storage entity for external transactions (e.g., GCash screenshots).
 * - DATA SYNC LAYER: When state transitions to 'Approved', an automated database hook or event must update `registrations.payment_status` to 'Paid'.
 * - AUDIT LOGGER: `verified_by` matches the processing Officer's application user reference key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_proofs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('reg_id'); // Target validation anchor
            $table->text('image_url')->nullable(); // Path pointer to financial asset payload; nullable to allow placeholder rows
            $table->timestamp('uploaded_at')->useCurrent();
            
            // Workflow assessment metrics
            $table->enum('status', ['Pending_Review', 'Approved', 'Rejected'])->default('Pending_Review');
            $table->uuid('verified_by')->nullable(); // Target verifying management authority account
            
            $table->timestamps();

            $table->foreign('reg_id')->references('id')->on('registrations')->onDelete('cascade');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_proofs');
    }
};