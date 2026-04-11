<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Admin\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Semua route API terdaftar di sini.
| Route publik: tidak memerlukan autentikasi
| Route protected: memerlukan Bearer token dari Sanctum
| Route admin: memerlukan token + role admin
|
*/

// ── Public Routes (tidak perlu login) ──────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Protected Routes (perlu login / Bearer token) ──────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Profile user
    Route::get('/users/{username}',          [UserController::class, 'show']);
    Route::post('/users/{username}/follow',  [\App\Http\Controllers\Api\FollowController::class, 'toggleFollow']);
    Route::post('/profile',                  [UserController::class, 'updateProfile']); // POST karena multipart/form-data

    // Posts (feed & CRUD)
    Route::get('/posts',         [PostController::class, 'index']);   // Feed dengan optional ?hashtag=
    Route::post('/posts',        [PostController::class, 'store']);
    Route::get('/posts/{id}',    [PostController::class, 'show']);
    Route::post('/posts/{id}',   [PostController::class, 'update']); // POST karena FormData tidak support PUT multipart
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);
    Route::post('/posts/{postId}/like', [LikeController::class, 'toggleLike']);

    // Notifications
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::post('/notifications/mark-read',   [NotificationController::class, 'markAsRead']);

    // Comments (nested under posts)
    Route::get('/posts/{postId}/comments',    [CommentController::class, 'index']);
    Route::post('/posts/{postId}/comments',   [CommentController::class, 'store']);
    Route::post('/comments/{id}',             [CommentController::class, 'update']); // POST for FormData
    Route::delete('/comments/{id}',           [CommentController::class, 'destroy']);

    // ── Admin Routes (perlu login + role admin) ─────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {

        // Dashboard statistik
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // Manajemen post
        Route::get('/posts',                [AdminController::class, 'posts']);
        Route::put('/posts/{id}/reject',    [AdminController::class, 'rejectPost']);
        Route::put('/posts/{id}/approve',   [AdminController::class, 'approvePost']);

        // Manajemen komentar
        Route::get('/comments',                  [AdminController::class, 'comments']);
        Route::put('/comments/{id}/reject',      [AdminController::class, 'rejectComment']);
        Route::put('/comments/{id}/approve',     [AdminController::class, 'approveComment']);

        // Manajemen bad words
        Route::get('/bad-words',          [AdminController::class, 'getBadWords']);
        Route::post('/bad-words',         [AdminController::class, 'addBadWord']);
        Route::delete('/bad-words/{id}',  [AdminController::class, 'deleteBadWord']);

        // Manajemen user
        Route::get('/users', [AdminController::class, 'users']);
    });
});
