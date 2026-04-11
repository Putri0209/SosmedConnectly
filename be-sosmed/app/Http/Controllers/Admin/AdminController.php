<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BadWord;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * AdminController - mengelola dashboard dan moderasi konten oleh admin.
 *
 * Endpoint (semua membutuhkan auth + role admin):
 * - GET    /api/admin/dashboard    -> Statistik platform
 * - GET    /api/admin/posts        -> Semua post untuk ditinjau
 * - GET    /api/admin/comments     -> Semua komentar untuk ditinjau
 * - PUT    /api/admin/posts/{id}/reject    -> Reject post
 * - PUT    /api/admin/comments/{id}/reject -> Reject komentar
 * - POST   /api/admin/bad-words    -> Tambah bad word
 * - DELETE /api/admin/bad-words/{id} -> Hapus bad word
 */
class AdminController extends Controller
{
    /**
     * Menampilkan statistik dashboard admin.
     * Menghitung jumlah post pending review, komentar pending, total post, dan total user.
     *
     * @return JsonResponse Statistik platform
     */
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'stats' => [
                // Jumlah post yang perlu ditinjau (status flagged)
                'posts_pending_review'    => Post::where('status', 'flagged')->count(),
                // Jumlah komentar yang perlu ditinjau
                'comments_pending_review' => Comment::where('status', 'flagged')->count(),
                // Total semua post
                'total_posts'             => Post::count(),
                // Total user terdaftar
                'total_users'             => User::where('role', 'user')->count(),
                // Total post yang di-reject
                'rejected_posts'          => Post::where('status', 'rejected')->count(),
                // Total komentar yang di-reject
                'rejected_comments'       => Comment::where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Menampilkan semua post untuk ditinjau admin.
     * Menampilkan post berdasarkan status yang difilter (semua, flagged, aktif, rejected).
     *
     * @param Request $request Query: status (opsional, default: semua)
     * @return JsonResponse Paginated list of posts
     */
    public function posts(Request $request): JsonResponse
    {
        $query = Post::with(['user', 'media', 'hashtags'])
            ->orderBy('created_at', 'desc');

        // Filter berdasarkan status jika diminta
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Menampilkan semua komentar untuk ditinjau admin.
     *
     * @param Request $request Query: status (opsional)
     * @return JsonResponse Paginated list of comments
     */
    public function comments(Request $request): JsonResponse
    {
        $query = Comment::with(['user', 'post', 'media'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Me-reject sebuah post yang melanggar aturan.
     * Post yang di-reject tidak akan tampil di feed.
     *
     * @param Request $request Data: reason (alasan penolakan)
     * @param int $id ID post
     * @return JsonResponse Konfirmasi reject
     */
    public function rejectPost(Request $request, int $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Update status post menjadi rejected dengan alasan dari admin
        $post->update([
            'status'      => 'rejected',
            'flag_reason' => $validated['reason'],
        ]);

        return response()->json([
            'message' => 'Post berhasil di-reject',
            'post'    => $post,
        ]);
    }

    /**
     * Me-restore post yang sebelumnya di-flag atau di-reject.
     * Mengembalikan post ke status active.
     *
     * @param int $id ID post
     * @return JsonResponse Konfirmasi restore
     */
    public function approvePost(int $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        $post->update([
            'status'      => 'active',
            'is_flagged'  => false,
            'flag_reason' => null,
        ]);

        return response()->json([
            'message' => 'Post berhasil disetujui',
            'post'    => $post,
        ]);
    }

    /**
     * Me-reject komentar yang melanggar aturan.
     *
     * @param Request $request Data: reason (alasan penolakan)
     * @param int $id ID komentar
     * @return JsonResponse Konfirmasi reject
     */
    public function rejectComment(Request $request, int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $comment->update([
            'status'      => 'rejected',
            'flag_reason' => $validated['reason'],
        ]);

        return response()->json([
            'message' => 'Komentar berhasil di-reject',
            'comment' => $comment,
        ]);
    }

    /**
     * Menyetujui komentar yang di-flag.
     *
     * @param int $id ID komentar
     * @return JsonResponse Konfirmasi approve
     */
    public function approveComment(int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        $comment->update([
            'status'      => 'active',
            'is_flagged'  => false,
            'flag_reason' => null,
        ]);

        return response()->json([
            'message' => 'Komentar berhasil disetujui',
            'comment' => $comment,
        ]);
    }

    /**
     * Menambahkan kata baru ke daftar bad words.
     *
     * @param Request $request Data: word (kata yang dilarang)
     * @return JsonResponse Data bad word yang ditambahkan
     */
    public function addBadWord(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'word' => 'required|string|max:100|unique:bad_words,word',
        ]);

        $badWord = BadWord::create(['word' => strtolower($validated['word'])]);

        return response()->json([
            'message'  => 'Bad word berhasil ditambahkan',
            'bad_word' => $badWord,
        ], 201);
    }

    /**
     * Menghapus kata dari daftar bad words.
     *
     * @param int $id ID bad word
     * @return JsonResponse Konfirmasi penghapusan
     */
    public function deleteBadWord(int $id): JsonResponse
    {
        $badWord = BadWord::findOrFail($id);
        $badWord->delete();

        return response()->json(['message' => 'Bad word berhasil dihapus']);
    }

    /**
     * Menampilkan seluruh daftar bad words yang terdaftar.
     *
     * @return JsonResponse Daftar semua bad words
     */
    public function getBadWords(): JsonResponse
    {
        return response()->json(BadWord::orderBy('word')->get());
    }

    /**
     * Menampilkan semua user terdaftar (khusus admin).
     *
     * @return JsonResponse Paginated list of users
     */
    public function users(): JsonResponse
    {
        return response()->json(
            User::select('id', 'name', 'username', 'email', 'role', 'created_at')
                ->orderBy('created_at', 'desc')
                ->paginate(20)
        );
    }
}
