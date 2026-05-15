<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Profile data registry for verified, campus-accredited organizations.
 * - BUSINESS LOGIC RULE: `accreditation_status` acts as a feature gate. If set to 'Suspended', the organization cannot publish events.
 * - AUDIT TRAIL: `accredited_by` maps to the Overseer who executed the latest certification state shift.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->char('id', 36)->primary();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->text('logo_url')->nullable();
            $table->string('adviser', 150)->nullable();

            $table->unsignedInteger('category_id');
            $table->foreign('category_id')->references('id')->on('org_categories')->onDelete('restrict');

            $table->char('accredited_by', 36)->nullable();
            $table->enum('accreditation_status', ['Active', 'Suspended'])->default('Active');
            $table->timestamp('accredited_at')->nullable();
            $table->timestamps();

            $table->foreign('accredited_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
