<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk tabel posts.
 * Menyimpan postingan user termasuk teks, status moderasi, dan flag bad words.
 */
return new class extends Migration
{
    /**
     * Menjalankan migration.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Relasi ke user
            $table->text('content'); // Konten postingan (max 250 char di level aplikasi)
            $table->enum('status', ['active', 'flagged', 'rejected'])->default('active'); // Status moderasi
            $table->boolean('is_flagged')->default(false); // Ditandai mengandung bad words
            $table->text('flag_reason')->nullable(); // Alasan flag/reject dari admin
            $table->timestamps();
        });
    }

    /**
     * Rollback migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
