<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id(); // Integer Auto-Incrementing Primary Key

            $table->string('name'); // Full name (e.g., "College of Engineering and Information Technology")
            $table->string('code')->unique(); // Unique short code (e.g., "CEIT")

            $table->timestamps(); // Generates created_at and updated_at tracking columns
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
