<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * FollowController - menangani fitur follow dan unfollow antar pengguna.
 *
 * Endpoint:
 * - POST /api/users/{username}/follow -> Toggle follow/unfollow
 */
class FollowController extends Controller
{
    /**
     * Toggle status follow ke user tujuan.
     * Jika sudah follow, maka akan di-unfollow. Jika belum, akan di-follow.
     *
     * @param Request $request
     * @param string $username Username user yang akan di-follow/unfollow
     * @return JsonResponse Status follow terkini
     */
    public function toggleFollow(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $currentUser = $request->user();

        // Tidak bisa follow diri sendiri
        if ($currentUser->id === $targetUser->id) {
            return response()->json([
                'message' => 'Anda tidak bisa mem-follow diri sendiri.'
            ], 400);
        }

        // Cek apakah sudah follow
        $isFollowing = $currentUser->followings()->where('following_id', $targetUser->id)->exists();

        if ($isFollowing) {
            // Unfollow
            $currentUser->followings()->detach($targetUser->id);
            $message = 'Berhenti mengikuti ' . $targetUser->username;
            $following = false;
        } else {
            // Follow
            $currentUser->followings()->attach($targetUser->id);
            $message = 'Berhasil mengikuti ' . $targetUser->username;
            $following = true;
        }

        return response()->json([
            'message' => $message,
            'is_following' => $following,
            'followers_count' => $targetUser->followers()->count(),
        ]);
    }
}
