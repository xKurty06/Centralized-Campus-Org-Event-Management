<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
            $table->char('id', 36)->primary();

            $table->string('school_id', 20)->unique();
            $table->string('email', 150)->unique();

            $table->text('password_hash');

            $table->string('first_name', 100);
            $table->string('last_name', 100);

            // dept_id references departments.id (unsigned INT)
            $table->unsignedInteger('dept_id');
            $table->foreign('dept_id')->references('id')->on('departments')->onDelete('restrict');

            $table->tinyInteger('year_level')->unsigned();
            $table->enum('global_role', ['Overseer', 'User'])->default('User');
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });

        // Add CHECK constraint for email domain (MySQL 8+)
        DB::statement("ALTER TABLE users ADD CONSTRAINT chk_email CHECK (email LIKE '%@cvsu.edu.ph')");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
