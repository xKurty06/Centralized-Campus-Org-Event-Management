<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Outbound communication logging engine.
 * - STRUCTURAL ASSIGNMENT: `reference_id` stores context vectors (`event_id` or `registration_id`) to provide linkable pathways for downstream consumers.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // Targeted messaging recipient

            // Template selection matrix types
            $table->enum('type', ['Registration_Confirm', 'Payment_Success']);

            // Context mapping anchor variable (can point to events, registration targets, or proof contexts)
            $table->uuid('reference_id');

            $table->text('message'); // Pre-compiled raw text or localized textual message data string
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
