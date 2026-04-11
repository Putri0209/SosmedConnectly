<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentMedia;
use App\Models\Post;
use App\Services\BadWordsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * CommentController - menangani CRUD komentar pada post.
 *
 * Endpoint:
 * - GET    /api/posts/{postId}/comments         -> Semua komentar pada post
 * - POST   /api/posts/{postId}/comments         -> Tambah komentar
 * - PUT    /api/comments/{id}                   -> Update komentar milik sendiri
 * - DELETE /api/comments/{id}                   -> Hapus komentar milik sendiri
 */
class CommentController extends Controller
{
    /**
     * @var BadWordsService Service untuk filter konten
     */
    private BadWordsService $badWordsService;

    public function __construct(BadWordsService $badWordsService)
    {
        $this->badWordsService = $badWordsService;
    }

    /**
     * Menampilkan semua komentar pada sebuah post.
     * Komentar diurutkan dari yang paling baru (terbaru di atas).
     *
     * @param int $postId ID post
     * @return JsonResponse Paginated list of comments
     */
    public function index(int $postId): JsonResponse
    {
        $post = Post::findOrFail($postId);

        $comments = $post->comments()
            ->with(['user', 'media', 'hashtags'])
            ->where('status', '!=', 'rejected')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($comments);
    }

    /**
     * Menambahkan komentar baru pada sebuah post.
     * Logika sama dengan PostController::store untuk bad words dan media.
     *
     * @param Request $request Data komentar: content, images[], files[]
     * @param int $postId ID post yang dikomentari
     * @return JsonResponse Data komentar yang baru dibuat
     */
    public function store(Request $request, int $postId): JsonResponse
    {
        $post = Post::findOrFail($postId);

        $validated = $request->validate([
            'content'  => 'required|string|max:250', // Maks 250 karakter
            'images'   => 'sometimes|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'files'    => 'sometimes|array',
            'files.*'  => 'file|max:10240',
        ]);

        // Cek bad words pada konten komentar
        $isFlagged  = $this->badWordsService->containsBadWords($validated['content']);
        $status     = $isFlagged ? 'flagged' : 'active';
        $flagReason = $isFlagged ? 'Komentar mengandung kata yang tidak pantas.' : null;

        // Buat komentar
        $comment = Comment::create([
            'post_id'     => $post->id,
            'user_id'     => $request->user()->id,
            'content'     => $validated['content'],
            'status'      => $status,
            'is_flagged'  => $isFlagged,
            'flag_reason' => $flagReason,
        ]);

        // Upload gambar untuk komentar
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('comments/images', 'public');
                CommentMedia::create([
                    'comment_id' => $comment->id,
                    'file_path'  => $path,
                    'file_name'  => $image->getClientOriginalName(),
                    'file_type'  => $image->getMimeType(),
                    'media_type' => 'image',
                ]);
            }
        }

        // Upload file untuk komentar
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('comments/files', 'public');
                CommentMedia::create([
                    'comment_id' => $comment->id,
                    'file_path'  => $path,
                    'file_name'  => $file->getClientOriginalName(),
                    'file_type'  => $file->getMimeType(),
                    'media_type' => 'file',
                ]);
            }
        }

        // Ekstrak dan simpan hashtag dari komentar
        $hashtagNames = $this->badWordsService->extractHashtags($validated['content']);
        if (!empty($hashtagNames)) {
            $hashtagIds = $this->badWordsService->syncHashtags($hashtagNames);
            $comment->hashtags()->sync($hashtagIds);
        }

        $comment->load(['user', 'media', 'hashtags']);

        // Send notification to post owner
        if ($post->user_id !== $request->user()->id) {
            $post->user->notify(new \App\Notifications\PostCommented($request->user(), $post));
        }

        return response()->json([
            'message'    => $isFlagged
                ? 'Komentar ditandai untuk ditinjau karena mengandung konten tidak pantas.'
                : 'Komentar berhasil ditambahkan',
            'is_flagged' => $isFlagged,
            'comment'    => $comment,
        ], 201);
    }

    /**
     * Mengupdate komentar. Hanya pemilik komentar yang bisa mengupdate.
     *
     * @param Request $request
     * @param int $id ID komentar
     * @return JsonResponse Data komentar yang diupdate
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        // Verifikasi kepemilikan komentar
        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan mengubah komentar ini'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:250',
        ]);

        $isFlagged  = $this->badWordsService->containsBadWords($validated['content']);
        $status     = $isFlagged ? 'flagged' : 'active';
        $flagReason = $isFlagged ? 'Komentar mengandung kata yang tidak pantas.' : null;

        $comment->update([
            'content'     => $validated['content'],
            'status'      => $status,
            'is_flagged'  => $isFlagged,
            'flag_reason' => $flagReason,
        ]);

        // Update hashtag
        $hashtagNames = $this->badWordsService->extractHashtags($validated['content']);
        $hashtagIds   = $this->badWordsService->syncHashtags($hashtagNames);
        $comment->hashtags()->sync($hashtagIds);

        $comment->load(['user', 'media', 'hashtags']);

        return response()->json([
            'message'    => 'Komentar berhasil diupdate',
            'is_flagged' => $isFlagged,
            'comment'    => $comment,
        ]);
    }

    /**
     * Menghapus komentar. Hanya pemilik komentar yang bisa menghapus.
     *
     * @param Request $request
     * @param int $id ID komentar
     * @return JsonResponse Pesan sukses
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan menghapus komentar ini'], 403);
        }

        // Hapus file media dari storage
        foreach ($comment->media as $media) {
            Storage::disk('public')->delete($media->file_path);
        }

        $comment->delete();

        return response()->json(['message' => 'Komentar berhasil dihapus']);
    }
}
