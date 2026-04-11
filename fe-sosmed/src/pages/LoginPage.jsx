import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

/**
 * LoginPage - Halaman login user.
 *
 * Fitur:
 * - Form email dan password
 * - Validasi client-side
 * - Simpan token ke AuthContext setelah login berhasil
 * - Redirect ke feed atau admin dashboard berdasarkan role
 */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect jika sudah login
  if (isAuthenticated) return null

  /**
   * Handle submit form login.
   * Mengirim kredensial ke API dan menyimpan token jika berhasil.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/login', form)
      login(res.data.token, res.data.user)
      // Redirect berdasarkan role user
      navigate(res.data.user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm border-0" style={{ borderRadius: 16 }}>
            <div className="card-body p-4">
              {/* Header */}
              <div className="text-center mb-4">
                <i className="bi bi-asterisk" style={{ fontSize: '2.5rem', color: '#1d9bf0' }}></i>
                <h2 className="mt-2 fw-bold">Masuk ke Connectly</h2>
                <p className="text-muted">Selamat datang kembali!</p>
              </div>

              {/* Error alert */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@contoh.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                  style={{ borderRadius: 20 }}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : null}
                  {loading ? 'Masuk...' : 'Masuk'}
                </button>
              </form>

              <hr />
              <p className="text-center mb-0">
                Belum punya akun?{' '}
                <Link to="/register" className="text-primary fw-semibold">Daftar sekarang</Link>
              </p>

              {/* Demo credentials info */}
              {/* <div className="alert alert-info mt-3 small">
                <strong>Demo:</strong><br />
                Admin: admin@socialmedia.com / password123<br />
                User: demo@socialmedia.com / password123
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
