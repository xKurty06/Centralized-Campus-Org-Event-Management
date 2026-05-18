<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Stores the full profile of every accredited campus organization.
 * - BUSINESS LOGIC: Only organizations with 'Active' status are permitted to publish events.
 * - AUDIT TRAIL: 'accredited_by' records the Overseer who last updated the status.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            // Primary Key: UUID
            $table->uuid('id')->primary();

            // Profile Information
            $table->string('name', 200)->unique();
            $table->text('description')->nullable();
            $table->text('logo_url')->nullable();
            $table->string('adviser', 150)->nullable();

            // Added: The date the organization was officially established
            $table->date('founded_date')->nullable();

            // Foreign Key: Org Category (Academic, Non-Academic, Religious)
            $table->unsignedInteger('category_id');
            $table->foreign('category_id')
                ->references('id')
                ->on('org_categories')
                ->onDelete('restrict');

            // Accreditation & Governance
            $table->enum('accreditation_status', ['Active', 'Suspended'])->default('Active');

            // Foreign Key: UUID of the Overseer (User)
            $table->uuid('accredited_by')->nullable();
            $table->foreign('accredited_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->timestamp('accredited_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
