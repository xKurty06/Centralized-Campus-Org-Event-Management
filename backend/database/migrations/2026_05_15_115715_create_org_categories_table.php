<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Pre-seeded categorization lookup table for student groups.
 * - SCOPE: Powers categorical filtering on the frontend Organization Directory search view.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('org_categories', function (Blueprint $table) {
            $table->id();
            // Restricts categorization to structural pillars specified by institutional rules.
            $table->enum('name', ['Academic', 'Non-Academic', 'Religious']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('org_categories');
    }
};
