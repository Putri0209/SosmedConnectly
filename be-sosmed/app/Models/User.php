<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Model User - merepresentasikan pengguna aplikasi.
 *
 * Relasi:
 * - posts(): satu user memiliki banyak post
 * - comments(): satu user memiliki banyak komentar
 *
 * Fitur:
 * - Role-based access (user / admin)
 * - Foto profil dan bio
 * - Autentikasi via Laravel Sanctum (token-based API)
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Kolom yang boleh diisi secara massal (mass assignment).
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'bio',
        'avatar_url',
    ];

    /**
     * Kolom yang disembunyikan saat serialisasi (tidak keluar di JSON response).
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Type casting untuk kolom tertentu.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relasi: satu user memiliki banyak post.
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Relasi: satu user memiliki banyak komentar.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Relasi: user yang mengikuti user ini (Followers).
     */
    public function followers()
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')->withTimestamps();
    }

    /**
     * Relasi: user yang diikuti oleh user ini (Followings).
     */
    public function followings()
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')->withTimestamps();
    }

    /**
     * Mengecek apakah user memiliki role admin.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Mendapatkan URL lengkap untuk avatar.
     * Mengubah path relatif (dari DB) menjadi URL absolut.
     *
     * @param string|null $value
     * @return string|null
     */
    public function getAvatarUrlAttribute($value): ?string
    {
        if ($value) {
            if (str_starts_with($value, 'http')) {
                return $value;
            }
            return asset('storage/' . $value);
        }
        return null;
    }
}
