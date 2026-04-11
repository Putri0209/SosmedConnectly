<?php

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
|
| Konfigurasi Cross-Origin Resource Sharing untuk mengizinkan
| frontend React (localhost:5173) berkomunikasi dengan API Laravel.
|
| Di production, ganti '*' dengan domain frontend yang sebenarnya.
|
*/

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Izinkan request dari frontend React (Vite dev server)
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Penting: true agar Sanctum bisa mengirim cookie session
    'supports_credentials' => true,

];
