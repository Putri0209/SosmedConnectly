<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware AdminMiddleware - memastikan hanya user dengan role 'admin' yang bisa mengakses route tertentu.
 *
 * Cara kerja:
 * 1. Cek apakah user sudah login (handled oleh auth:sanctum sebelumnya)
 * 2. Cek apakah role user adalah 'admin'
 * 3. Jika bukan admin, kembalikan response 403 Forbidden
 */
class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next Handler berikutnya dalam middleware stack
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Pastikan user sudah terotentikasi dan memiliki role admin
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Akses ditolak. Hanya admin yang diperbolehkan.',
            ], 403);
        }

        return $next($request);
    }
}
