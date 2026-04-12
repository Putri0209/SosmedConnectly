import axios from 'axios'

/**
 * Instance Axios yang sudah dikonfigurasi untuk berkomunikasi dengan Laravel API.
 *
 * Konfigurasi:
 * - Base URL: /api (di-proxy oleh Vite ke http://localhost:8000)
 * - Request interceptor: otomatis menyisipkan Authorization header
 * - Response interceptor: handle error 401 (redirect ke login)
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL +'/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

/**
 * Request Interceptor.
 * Sebelum setiap request dikirim, ambil token dari localStorage
 * dan sisipkan ke header Authorization sebagai Bearer token.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response Interceptor.
 * Jika server merespons dengan 401 (Unauthorized), berarti token tidak valid
 * atau sudah expired. Hapus token dari localStorage dan redirect ke halaman login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Hapus token yang sudah tidak valid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirect ke halaman login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
