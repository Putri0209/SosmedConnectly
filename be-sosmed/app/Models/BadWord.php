<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

/**
 * Model BadWord - daftar kata-kata terlarang untuk filter konten.
 * Admin dapat menambah/menghapus kata yang dianggap tidak pantas.
 */
class BadWord extends Model
{
    protected $fillable = ['word'];

    /**
     * Mengambil semua bad words sebagai array string.
     * Digunakan oleh BadWordsService untuk pengecekan konten.
     *
     * @return array<string>
     */
    public static function getAllWords(): array
    {
        return static::pluck('word')->map(fn($w) => strtolower($w))->toArray();
    }
}
