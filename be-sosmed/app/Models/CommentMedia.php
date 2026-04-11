<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

/**
 * Model CommentMedia - file/gambar yang dilampirkan pada komentar.
 */
class CommentMedia extends Model
{
    protected $fillable = ['comment_id', 'file_path', 'file_name', 'file_type', 'media_type'];
    protected $table = 'comment_media';
    protected $appends = ['url'];

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
}
