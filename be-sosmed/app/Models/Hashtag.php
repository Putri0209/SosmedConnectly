<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Hashtag - menyimpan daftar hashtag yang digunakan di platform.
 * Setiap hashtag dapat digunakan oleh banyak post dan komentar.
 */
class Hashtag extends Model
{
    protected $fillable = ['name'];

    /** Relasi many-to-many ke post melalui pivot hashtag_post. */
    public function posts()
    {
        return $this->belongsToMany(Post::class, 'hashtag_post');
    }

    /** Relasi many-to-many ke comment melalui pivot hashtag_comment. */
    public function comments()
    {
        return $this->belongsToMany(Comment::class, 'hashtag_comment');
    }
}
