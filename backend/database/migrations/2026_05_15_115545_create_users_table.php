<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Central repository for all verified campus accounts (Students, Faculty, Overseers).
 * - AUTHENTICATION KEY: `school_id` serves as the primary unique login identifier.
 * - SECURITY ENFORCEMENT: `email` must strictly pass application-level validation checking for the "@cvsu.edu.ph" domain.
 * - ACCOUNT LIFECYCLE: Hard-deletes are forbidden. `is_active = false` blocks login but preserves critical student audit trails.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // Unique tracking key generated via application-layer UUIDv4
            $table->uuid('id')->primary();

            // Format: YYYY-N-XXXXX (e.g., 2023-1-00123). Primary login lookup key.
            $table->string('school_id')->unique();

            // Strictly validated to accept ONLY @cvsu.edu.ph domains.
            $table->string('email')->unique();

            // Secure bcrypt/argon2 credentials string. Plaintext storage is strictly prohibited.
            $table->text('password_hash');

            $table->string('first_name');
            $table->string('last_name');

            // RELATION: Links user to their academic structural group (e.g., CEIT, CAS).
            $table->foreignId('dept_id')->constrained('departments');

            // Values restricted to integer range [1, 5] at application layer.
            $table->integer('year_level');

            // Platform-wide infrastructure role. Note: Org-specific roles belong to Org_Officers table.
            $table->enum('global_role', ['Overseer', 'User'])->default('User');

            // Audit lock state. If false, block API token generation and access.
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
