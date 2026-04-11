<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * UserController - menangani manajemen profil user.
 *
 * Endpoint:
 * - GET  /api/users/{username}  -> Lihat profil user
 * - PUT  /api/profile           -> Update bio dan avatar
 */
class UserController extends Controller
{
    /**
     * Menampilkan profil publik user berdasarkan username.
     * Menyertakan post-post yang dibuat user tersebut (yang aktif).
     *
     * @param string $username Username user yang ingin dilihat
     * @return JsonResponse Data profil dan post user
     */
    public function show(Request $request, string $username): JsonResponse
    {
        $user = \App\Models\User::where('username', $username)
            ->firstOrFail();

        // Ambil post user dengan relasi media dan hashtag, urutkan terbaru
        $posts = $user->posts()
            ->with(['user', 'media', 'hashtags', 'comments.user', 'comments.media'])
            ->withCount('likes')
            ->where('status', '!=', 'rejected')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $isFollowing = false;
        if ($request->user()) {
            $isFollowing = $request->user()->followings()->where('following_id', $user->id)->exists();
        }

        return response()->json([
            'user'  => [
                'id'               => $user->id,
                'name'             => $user->name,
                'username'         => $user->username,
                'bio'              => $user->bio,
                'avatar_url'       => $user->avatar_url,
                'role'             => $user->role,
                'followers_count'  => $user->followers()->count(),
                'followings_count' => $user->followings()->count(),
                'is_following'     => $isFollowing,
            ],
            'posts' => $posts,
        ]);
    }

    /**
     * Mengupdate profil user yang sedang login.
     * Mendukung update bio dan foto profil (avatar).
     *
     * Proses avatar:
     * 1. Validasi file (maks 2MB, format jpg/png/gif)
     * 2. Hapus avatar lama dari storage jika ada
     * 3. Simpan avatar baru ke storage/avatars/
     *
     * @param Request $request Data update: name, bio, avatar (file opsional)
     * @return JsonResponse Data user yang sudah diupdate
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'bio'    => 'sometimes|nullable|string|max:500',
            'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048', // Maks 2MB
        ]);

        // Proses upload avatar baru jika ada
        if ($request->hasFile('avatar')) {
            // Hapus avatar lama untuk menghemat storage
            if ($user->getRawOriginal('avatar_url')) {
                Storage::disk('public')->delete($user->getRawOriginal('avatar_url'));
            }
            // Simpan file baru ke folder avatars/ dengan nama unik
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = $path;
        }

        // Update field yang dikirim
        if (isset($validated['name']))  $user->name  = $validated['name'];
        if (isset($validated['bio']))   $user->bio   = $validated['bio'];

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diupdate',
            'user'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'username'   => $user->username,
                'bio'        => $user->bio,
                'avatar_url' => $user->avatar_url,
                'role'       => $user->role,
            ],
        ]);
    }
}
