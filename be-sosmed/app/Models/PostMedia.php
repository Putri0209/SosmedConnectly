<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

/**
 * Model PostMedia - menyimpan informasi file/gambar yang dilampirkan pada post.
 * Setiap post dapat memiliki banyak media.
 */
class PostMedia extends Model
{
    protected $fillable = ['post_id', 'file_path', 'file_name', 'file_type', 'media_type'];
    protected $table = 'post_media';
    protected $appends = ['url'];

    /** Relasi ke post induk. */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Getter untuk URL lengkap file.
     * Menggabungkan base URL storage dengan path relatif.
     */
    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
}
