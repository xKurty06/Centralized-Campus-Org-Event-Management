<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * AI Agent Context:
 * - PURPOSE: Central repository for all verified campus accounts.
 * - AUTHENTICATION KEY: `school_id` is the primary login identifier.
 * - ACADEMIC HIERARCHY: Links to Departments and Courses (UUID-based).
 * - LIFECYCLE: Hard-deletes forbidden; 'is_active' used to preserve audit trails.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // id (PK): UUID. Unique identifier for the account.
            $table->uuid('id')->primary();

            // Unique campus ID (e.g., 2023-1-00123) used as login key.
            $table->string('school_id', 20)->unique();

            // Strictly enforces @cvsu.edu.ph institutional domain.
            $table->string('email', 150)->unique();

            $table->text('password_hash');
            $table->string('first_name', 100);
            $table->string('last_name', 100);

            // RELATIONSHIPS
            // dept_id references departments.id (Unsigned Integer)
            $table->unsignedInteger('dept_id');
            $table->foreign('dept_id')->references('id')->on('departments')->onDelete('restrict');

            // course_id references courses.id (UUID)
            $table->unsignedBigInteger('course_id');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('restrict');

            // ACADEMIC INFO
            $table->tinyInteger('year_level')->unsigned(); // (1–5)
            $table->integer('section'); // Student's specific class section assignment.

            // ACCESS CONTROL & STATE
            $table->enum('global_role', ['Overseer', 'User'])->default('User');
            $table->boolean('is_active')->default(true);

            $table->timestamp('created_at')->useCurrent();
        });

        // Add CHECK constraint for email domain (MySQL 8+)
        DB::statement("ALTER TABLE users ADD CONSTRAINT chk_email_domain CHECK (email LIKE '%@cvsu.edu.ph')");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
