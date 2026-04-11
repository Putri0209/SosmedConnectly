<?php

namespace App\Services;

use App\Models\BadWord;
use App\Models\Hashtag;

/**
 * Service BadWordsService - menangani logika bisnis terkait filter konten dan hashtag.
 *
 * Tanggung jawab:
 * 1. Mendeteksi bad words dalam konten
 * 2. Mengekstrak hashtag dari teks konten
 * 3. Menyinkronkan hashtag ke database
 */
class BadWordsService
{
    /**
     * Memeriksa apakah konten mengandung kata-kata terlarang.
     * Perbandingan dilakukan case-insensitive.
     *
     * @param string $content Konten yang akan diperiksa
     * @return bool True jika mengandung bad words
     */
    public function containsBadWords(string $content): bool
    {
        $words = BadWord::getAllWords();
        if (empty($words)) {
            return false;
        }

        $lowerContent = strtolower($content);
        foreach ($words as $badWord) {
            // Gunakan word boundary agar tidak match sebagian kata
            if (preg_match('/\b' . preg_quote($badWord, '/') . '\b/i', $lowerContent)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Mengekstrak semua hashtag dari teks konten.
     * Hashtag diawali dengan '#' dan hanya terdiri dari huruf, angka, underscore.
     *
     * @param string $content Konten post atau komentar
     * @return array<string> Daftar nama hashtag (tanpa '#', lowercase)
     */
    public function extractHashtags(string $content): array
    {
        preg_match_all('/#([a-zA-Z0-9_]+)/', $content, $matches);
        return array_unique(array_map('strtolower', $matches[1]));
    }

    /**
     * Menyinkronkan hashtag ke database dan mengembalikan array ID-nya.
     * Jika hashtag belum ada, akan dibuat baru (firstOrCreate).
     *
     * @param array<string> $hashtagNames Daftar nama hashtag
     * @return array<int> Daftar ID hashtag
     */
    public function syncHashtags(array $hashtagNames): array
    {
        $ids = [];
        foreach ($hashtagNames as $name) {
            $hashtag = Hashtag::firstOrCreate(['name' => $name]);
            $ids[] = $hashtag->id;
        }
        return $ids;
    }
}
