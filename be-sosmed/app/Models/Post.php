<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Post - merepresentasikan postingan user di sosial media.
 *
 * Relasi:
 * - user(): setiap post dimiliki oleh satu user
 * - comments(): satu post memiliki banyak komentar
 * - hashtags(): many-to-many dengan model Hashtag
 * - media(): satu post memiliki banyak media (gambar/file)
 *
 * Fitur:
 * - Konten teks dengan dukungan hashtag
 * - Upload gambar dan file
 * - Sistem moderasi (active, flagged, rejected)
 */
class Post extends Model
{
    use HasFactory;

    /**
     * Kolom yang dapat diisi massal.
     */
    protected $fillable = [
        'user_id',
        'content',
        'status',
        'is_flagged',
        'flag_reason',
    ];

    /**
     * Type casting kolom.
     */
    protected $casts = [
        'is_flagged' => 'boolean',
    ];

    /**
     * Relasi: post dimiliki oleh satu user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi: satu post memiliki banyak komentar, diurutkan terbaru.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class)->orderBy('created_at', 'desc');
    }

    /**
     * Relasi: satu post memiliki banyak like.
     */
    public function likes()
    {
        return $this->hasMany(Like::class);
    }


    /**
     * Relasi many-to-many: post dapat memiliki banyak hashtag.
     * Tabel pivot: hashtag_post
     */
    public function hashtags()
    {
        return $this->belongsToMany(Hashtag::class, 'hashtag_post');
    }

    /**
     * Relasi: satu post memiliki banyak media (gambar/file).
     */
    public function media()
    {
        return $this->hasMany(PostMedia::class);
    }

    /**
     * Scope untuk memfilter post berdasarkan hashtag.
     * Digunakan untuk fitur pencarian/filter hashtag.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $hashtag Nama hashtag tanpa '#'
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithHashtag($query, string $hashtag)
    {
        return $query->whereHas('hashtags', function ($q) use ($hashtag) {
            $q->where('name', strtolower($hashtag));
        });
    }

    /**
     * Scope untuk mengambil post yang aktif (tidak di-reject).
     */
    public function scopeActive($query)
    {
        return $query->where('status', '!=', 'rejected');
    }
}
