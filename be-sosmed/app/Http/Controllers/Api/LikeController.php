<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use App\Notifications\PostLiked;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LikeController extends Controller
{
    public function toggleLike(Request $request, $postId): JsonResponse
    {
        $post = Post::findOrFail($postId);
        $user = $request->user();

        $like = Like::where('user_id', $user->id)->where('post_id', $post->id)->first();

        if ($like) {
            // Unlike
            $like->delete();
             $post->user->notifications()
                ->where('type', PostLiked::class)
                ->whereJsonContains('data->post_id', $post->id)
                ->whereJsonContains('data->actor_id', $user->id)
                ->delete();
            return response()->json([
                'message' => 'Post unliked',
                'is_liked' => false,
                'likes_count' => $post->likes()->count()
            ]);
        } else {
            // Like
            Like::create([
                'user_id' => $user->id,
                'post_id' => $post->id,
            ]);

            // Notify owner
            if ($post->user_id !== $user->id) {
                // Avoid redundant notifications, only send if they didn't already get one recently, or just send it:
                $post->user->notify(new PostLiked($user, $post));
            }

            return response()->json([
                'message' => 'Post liked',
                'is_liked' => true,
                'likes_count' => $post->likes()->count()
            ]);
        }
    }
}
