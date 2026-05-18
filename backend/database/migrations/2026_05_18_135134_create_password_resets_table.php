<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Agent Context:
 * - PURPOSE: Manages secure password recovery via hashed verification codes.
 * - SECURITY: Implements an 'attempts' counter to mitigate brute-force attacks.
 * - EXPIRATION: Tokens are short-lived, governed by the 'expires_at' timestamp.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_resets', function (Blueprint $table) {
            // id (PK): Integer. Auto-incrementing unique identifier.
            $table->increments('id');

            // The email address associated with the recovery attempt.
            $table->string('email');

            // The SHA-256 hash of the 6-digit verification code.
            $table->string('code_hash');

            // Tracks failed attempts to prevent brute-forcing. Default 0.
            $table->integer('attempts')->default(0);

            // The time when the reset code becomes invalid.
            $table->timestamp('expires_at');

            // Default current timestamp.
            $table->timestamp('created_at')->useCurrent();

            // Indexing for faster lookups during the verification process
            $table->index(['email', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_resets');
    }
};