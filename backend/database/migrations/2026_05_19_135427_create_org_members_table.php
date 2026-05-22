<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Tracks the official membership roster for every organization.
 * - BUSINESS LOGIC: Distinguishes between general students and formal members to enforce 'Org_Members_Only' access control for events.
 * - MANUAL OVERRIDE: 'paid_membership_fee' is manually toggled by officers upon receiving physical cash/dues in real life.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('org_members', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            // Primary Key: UUID
            $table->uuid('id')->primary();

            // Foreign Key: The student linked to the organization (Refers to users.id)
            $table->uuid('user_id');
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Foreign Key: The specific organization the student has joined (Refers to organizations.id)
            $table->uuid('org_id');
            $table->foreign('org_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');

            // Membership Lifecycle Status
            $table->enum('membership_status', ['Pending', 'Active', 'Inactive'])->default('Pending');

            // Financial Tracking (Manually toggled by an officer once paid in person)
            $table->boolean('paid_membership_fee')->default(false);

            // Membership Audit Timestamps
            $table->timestamp('joined_at')->nullable(); // Records the exact moment they were officially accepted/added
            $table->timestamps(); // Generates created_at and updated_at

            // Integrity Constraint: A user can only have one membership record per organization
            $table->unique(['user_id', 'org_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('org_members');
    }
};
