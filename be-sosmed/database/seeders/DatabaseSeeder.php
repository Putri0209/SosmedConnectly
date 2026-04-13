<?php

namespace Database\Seeders;

use App\Models\BadWord;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DatabaseSeeder - mengisi database dengan data awal yang dibutuhkan aplikasi.
 *
 * Data yang di-seed:
 * 1. User admin default
 * 2. User demo biasa
 * 3. Daftar bad words awal
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Jalankan semua seeder database.
     */
    public function run(): void
    {
        // ── Buat user Admin ──────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@socialmedia.com'],
            [
                'name'     => 'Administrator',
                'username' => 'admin',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
                'bio'      => 'Administrator platform SocialMedia.',
            ]
        );

        // ── Buat user demo biasa ─────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'demo@socialmedia.com'],
            [
                'name'     => 'Demo User',
                'username' => 'demouser',
                'password' => Hash::make('password123'),
                'role'     => 'user',
                'bio'      => 'Ini adalah akun demo untuk testing.',
            ]
        );

        // ── Seed bad words awal ──────────────────────────────────────────────
        // Daftar kata-kata yang umum dianggap tidak pantas
        $badWords = [
            'bajingan',
            'bangsat',
            'brengsek',
            'goblok',
            'idiot',
            'tolol',
            'babi',
            'anjing',
        ];

        foreach ($badWords as $word) {
            BadWord::firstOrCreate(['word' => $word]);
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin: admin@socialmedia.com / password123');
        $this->command->info('Demo:  demo@socialmedia.com  / password123');
    }
}
