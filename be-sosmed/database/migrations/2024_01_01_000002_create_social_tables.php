<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk tabel comments.
 * Menyimpan komentar pada postingan dengan status moderasi.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Tabel komentar
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade'); // Relasi ke post
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Relasi ke user
            $table->text('content'); // Konten komentar (max 250 char di level aplikasi)
            $table->enum('status', ['active', 'flagged', 'rejected'])->default('active');
            $table->boolean('is_flagged')->default(false); // Ditandai bad words
            $table->text('flag_reason')->nullable(); // Alasan flag dari admin
            $table->timestamps();
        });

        // Tabel hashtag master
        Schema::create('hashtags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Nama hashtag tanpa '#', unik
            $table->timestamps();
        });

        // Pivot table antara post dan hashtag (many-to-many)
        Schema::create('hashtag_post', function (Blueprint $table) {
            $table->foreignId('hashtag_id')->constrained()->onDelete('cascade');
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->primary(['hashtag_id', 'post_id']); // Composite primary key
        });

        // Pivot table antara comment dan hashtag (many-to-many)
        Schema::create('hashtag_comment', function (Blueprint $table) {
            $table->foreignId('hashtag_id')->constrained()->onDelete('cascade');
            $table->foreignId('comment_id')->constrained()->onDelete('cascade');
            $table->primary(['hashtag_id', 'comment_id']);
        });

        // Media untuk post (gambar/file)
        Schema::create('post_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->string('file_path'); // Path file yang diupload
            $table->string('file_name'); // Nama asli file
            $table->string('file_type'); // MIME type (image/jpeg, application/pdf, dll)
            $table->enum('media_type', ['image', 'file']); // Kategori: gambar atau file
            $table->timestamps();
        });

        // Media untuk comment (gambar/file)
        Schema::create('comment_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->onDelete('cascade');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type');
            $table->enum('media_type', ['image', 'file']);
            $table->timestamps();
        });

        // Daftar kata-kata terlarang untuk filter konten
        Schema::create('bad_words', function (Blueprint $table) {
            $table->id();
            $table->string('word')->unique(); // Kata terlarang
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_media');
        Schema::dropIfExists('post_media');
        Schema::dropIfExists('hashtag_comment');
        Schema::dropIfExists('hashtag_post');
        Schema::dropIfExists('hashtags');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('bad_words');
    }
};
