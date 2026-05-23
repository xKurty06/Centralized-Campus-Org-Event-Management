<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('actor_id');
            $table->foreign('actor_id')->references('id')->on('users')->onDelete('restrict');
            $table->string('actor_name', 200);
            $table->string('actor_school_id', 20);
            $table->enum('actor_role', ['Overseer', 'Officer']);
            $table->enum('category', ['Accreditation', 'User', 'Event', 'Membership', 'Officer', 'Payment']);
            $table->string('action', 120);
            $table->string('target_label', 255);
            $table->string('target_id', 64);
            $table->text('meta')->nullable();
            $table->timestamp('timestamp')->useCurrent();

            $table->index('actor_id');
            $table->index('category');
            $table->index('timestamp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
