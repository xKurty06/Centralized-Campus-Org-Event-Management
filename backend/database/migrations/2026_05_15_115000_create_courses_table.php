<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Stores official academic degree courses (e.g., BSCS, BSIT).
 * - HIERARCHY: Department -> Courses -> Users.
 * - RELATIONSHIP: Links to Departments to establish which college owns the degree.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('course_code', 20)->unique();
            $table->string('course_name', 150);

            // FIX: Ensure this is unsignedInteger to match increments('id')
            $table->unsignedInteger('dept_id');

            // Now the constraint will work
            $table->foreign('dept_id')
                ->references('id')
                ->on('departments')
                ->onDelete('restrict');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
