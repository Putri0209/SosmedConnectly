<?php

use App\Http\Middleware\AdminMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

/*
|--------------------------------------------------------------------------
| Bootstrap Application (Laravel 12)
|--------------------------------------------------------------------------
|
| Konfigurasi utama aplikasi Laravel 12.
| Mendaftarkan middleware, exception handler, dan konfigurasi lainnya.
|
*/

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Daftarkan AdminMiddleware dengan alias 'admin'
        // Alias ini digunakan di routes/api.php: ->middleware('admin')
        $middleware->alias([
            'admin' => AdminMiddleware::class,
        ]);

        // Izinkan semua domain untuk CORS pada API (sesuaikan di production)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
