<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostMedia;
use App\Services\BadWordsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * PostController - menangani CRUD untuk postingan.
 *
 * Endpoint:
 * - GET    /api/posts           -> Semua post (feed), bisa filter hashtag
 * - POST   /api/posts           -> Buat post baru
 * - GET    /api/posts/{id}      -> Detail satu post
 * - PUT    /api/posts/{id}      -> Update post (hanya milik sendiri)
 * - DELETE /api/posts/{id}      -> Hapus post (hanya milik sendiri)
 */
class PostController extends Controller
{
    /**
     * @var BadWordsService Service untuk filter bad words dan ekstrak hashtag
     */
    private BadWordsService $badWordsService;

    /**
     * Constructor - inject BadWordsService via dependency injection.
     */
    public function __construct(BadWordsService $badWordsService)
    {
        $this->badWordsService = $badWordsService;
    }

    /**
     * Menampilkan feed semua post, diurutkan dari yang paling baru.
     * Mendukung filter berdasarkan hashtag.
     *
     * @param Request $request Query params: hashtag (opsional)
     * @return JsonResponse Paginated list of posts
     */
    public function index(Request $request): JsonResponse
    {
        $query = Post::with(['user', 'media', 'hashtags', 'comments.user', 'comments.media'])
            ->withCount('likes')
            ->withExists(['likes as is_liked' => function ($q) use ($request) {
                if ($request->user()) {
                    $q->where('user_id', $request->user()->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }])
            ->where('status', '!=', 'rejected') // Sembunyikan yang di-reject
            ->orderBy('created_at', 'desc');    // Terbaru di atas

        // Filter berdasarkan hashtag jika ada
        if ($request->has('hashtag') && $request->hashtag) {
            $query->withHashtag(ltrim($request->hashtag, '#'));
        }

        // Filter berdasarkan feed following
        if ($request->has('feed') && $request->feed === 'following' && $request->user()) {
            $followingIds = $request->user()->followings()->pluck('users.id');
            $query->whereIn('user_id', $followingIds);
        }

        $posts = $query->paginate(10);

        return response()->json($posts);
    }

    /**
     * Membuat post baru.
     * Proses: validasi -> cek bad words -> upload media -> ekstrak hashtag -> simpan
     *
     * Bad words handling:
     * - Jika konten mengandung bad words, post disimpan dengan status 'flagged'
     * - Post yang flagged tetap tampil tapi diberi alert ke user
     *
     * @param Request $request Data post: content, images[] (opsional), files[] (opsional)
     * @return JsonResponse Data post yang baru dibuat
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:250', // Maksimum 250 karakter
            'images'  => 'sometimes|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120', // Maks 5MB per gambar
            'files'   => 'sometimes|array',
            'files.*' => 'file|max:10240', // Maks 10MB per file
        ]);

        // Cek apakah konten mengandung bad words
        $isFlagged   = $this->badWordsService->containsBadWords($validated['content']);
        $status      = $isFlagged ? 'flagged' : 'active';
        $flagReason  = $isFlagged ? 'Konten mengandung kata yang tidak pantas dan sedang ditinjau admin.' : null;

        // Buat post baru
        $post = Post::create([
            'user_id'     => $request->user()->id,
            'content'     => $validated['content'],
            'status'      => $status,
            'is_flagged'  => $isFlagged,
            'flag_reason' => $flagReason,
        ]);

        // Upload dan simpan gambar yang dilampirkan
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('posts/images', 'public');
                PostMedia::create([
                    'post_id'    => $post->id,
                    'file_path'  => $path,
                    'file_name'  => $image->getClientOriginalName(),
                    'file_type'  => $image->getMimeType(),
                    'media_type' => 'image',
                ]);
            }
        }

        // Upload dan simpan file non-gambar yang dilampirkan
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('posts/files', 'public');
                PostMedia::create([
                    'post_id'    => $post->id,
                    'file_path'  => $path,
                    'file_name'  => $file->getClientOriginalName(),
                    'file_type'  => $file->getMimeType(),
                    'media_type' => 'file',
                ]);
            }
        }

        // Ekstrak hashtag dari konten dan simpan ke database
        $hashtagNames = $this->badWordsService->extractHashtags($validated['content']);
        if (!empty($hashtagNames)) {
            $hashtagIds = $this->badWordsService->syncHashtags($hashtagNames);
            $post->hashtags()->sync($hashtagIds);
        }

        // Load relasi untuk response
        $post->load(['user', 'media', 'hashtags', 'comments']);

        return response()->json([
            'message'    => $isFlagged
                ? 'Post dibuat namun ditandai untuk ditinjau karena mengandung konten tidak pantas.'
                : 'Post berhasil dibuat',
            'is_flagged' => $isFlagged,
            'post'       => $post,
        ], 201);
    }

    /**
     * Menampilkan detail satu post beserta komentar-komentarnya.
     *
     * @param int $id ID post
     * @return JsonResponse Data post lengkap
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $post = Post::with(['user', 'media', 'hashtags', 'comments.user', 'comments.media', 'comments.hashtags'])
            ->withCount('likes')
            ->withExists(['likes as is_liked' => function ($q) use ($request) {
                if ($request->user()) {
                    $q->where('user_id', $request->user()->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }])
            ->where('status', '!=', 'rejected')
            ->findOrFail($id);

        return response()->json($post);
    }

    /**
     * Mengupdate post yang dimiliki oleh user yang sedang login.
     * Hanya pemilik post yang bisa mengupdate postingannya.
     *
     * @param Request $request Data update
     * @param int $id ID post yang akan diupdate
     * @return JsonResponse Data post yang sudah diupdate
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        // Pastikan hanya pemilik post yang bisa mengupdate
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan mengubah post ini'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:250',
        ]);

        // Re-check bad words setelah update
        $isFlagged  = $this->badWordsService->containsBadWords($validated['content']);
        $status     = $isFlagged ? 'flagged' : 'active';
        $flagReason = $isFlagged ? 'Konten mengandung kata yang tidak pantas dan sedang ditinjau admin.' : null;

        $post->update([
            'content'     => $validated['content'],
            'status'      => $status,
            'is_flagged'  => $isFlagged,
            'flag_reason' => $flagReason,
        ]);

        // Update hashtag berdasarkan konten baru
        $hashtagNames = $this->badWordsService->extractHashtags($validated['content']);
        $hashtagIds   = $this->badWordsService->syncHashtags($hashtagNames);
        $post->hashtags()->sync($hashtagIds);

        $post->load(['user', 'media', 'hashtags']);

        return response()->json([
            'message'    => 'Post berhasil diupdate',
            'is_flagged' => $isFlagged,
            'post'       => $post,
        ]);
    }

    /**
     * Menghapus post beserta semua media yang terkait.
     * Hanya pemilik post yang bisa menghapus.
     *
     * @param Request $request
     * @param int $id ID post yang akan dihapus
     * @return JsonResponse Pesan sukses
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        // Cek kepemilikan
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan menghapus post ini'], 403);
        }

        // Hapus semua file media dari storage sebelum menghapus record
        foreach ($post->media as $media) {
            Storage::disk('public')->delete($media->file_path);
        }

        $post->delete(); // Cascade delete akan menghapus media, comments, hashtag pivots

        return response()->json(['message' => 'Post berhasil dihapus']);
    }
}
