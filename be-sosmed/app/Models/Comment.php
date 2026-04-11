<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Comment - merepresentasikan komentar pada sebuah post.
 *
 * Relasi:
 * - post(): komentar milik satu post
 * - user(): komentar dibuat oleh satu user
 * - hashtags(): many-to-many dengan hashtag
 * - media(): komentar dapat memiliki gambar/file
 */
class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'user_id',
        'content',
        'status',
        'is_flagged',
        'flag_reason',
    ];

    protected $casts = [
        'is_flagged' => 'boolean',
    ];

    /** Relasi ke post induk. */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /** Relasi ke user pembuat komentar. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi many-to-many dengan hashtag.
     * Tabel pivot: hashtag_comment
     */
    public function hashtags()
    {
        return $this->belongsToMany(Hashtag::class, 'hashtag_comment');
    }

    /** Relasi ke media yang dilampirkan pada komentar. */
    public function media()
    {
        return $this->hasMany(CommentMedia::class);
    }
}
