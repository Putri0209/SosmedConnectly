<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

/**
 * AuthController - menangani autentikasi user via API.
 *
 * Endpoint:
 * - POST /api/register  -> Daftar akun baru
 * - POST /api/login     -> Login dan dapatkan token
 * - POST /api/logout    -> Logout dan hapus token
 * - GET  /api/me        -> Data user yang sedang login
 */
class AuthController extends Controller
{
    /**
     * Mendaftarkan user baru ke sistem.
     * Membuat akun, lalu langsung mengembalikan token autentikasi.
     *
     * @param Request $request Data registrasi: name, username, email, password
     * @return JsonResponse Token + data user
     */
    public function register(Request $request): JsonResponse
    {
        // Validasi input registrasi
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users|alpha_dash',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // Buat user baru dengan password yang sudah di-hash
        $user = User::create([
            'name'     => $validated['name'],
            'username' => $validated['username'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'user', // Default role adalah 'user'
        ]);

        // Buat token Sanctum untuk user baru
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'token'   => $token,
            'user'    => $this->formatUser($user),
        ], 201);
    }

    /**
     * Login user dan mengembalikan token autentikasi.
     * Token digunakan pada setiap request API selanjutnya.
     *
     * @param Request $request Data login: email, password
     * @return JsonResponse Token + data user, atau error 401
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Cek kredensial user
        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah',
            ], 401);
        }

        // Hapus token lama, buat token baru (single session)
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'token'   => $token,
            'user'    => $this->formatUser($user),
        ]);
    }

    /**
     * Logout user dengan menghapus semua token aktif.
     *
     * @param Request $request
     * @return JsonResponse Pesan sukses
     */
    public function logout(Request $request): JsonResponse
    {
        // Hapus semua token milik user yang sedang login
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }

    /**
     * Mendapatkan data user yang sedang terautentikasi.
     *
     * @param Request $request
     * @return JsonResponse Data user
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($this->formatUser($request->user()));
    }

    /**
     * Format data user untuk response API.
     * Menyertakan URL lengkap avatar jika ada.
     *
     * @param User $user
     * @return array<string, mixed>
     */
    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'username'   => $user->username,
            'email'      => $user->email,
            'role'       => $user->role,
            'bio'        => $user->bio,
            'avatar_url' => $user->avatar_url,
        ];
    }
}
