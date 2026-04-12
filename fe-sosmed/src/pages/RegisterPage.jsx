import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/axios'

/**
 * RegisterPage - Halaman registrasi user baru.
 *
 * Fitur:
 * - Form name, username, email, password, konfirmasi password
 * - Validasi Laravel ditampilkan per-field
 * - Auto-login setelah registrasi berhasil
 */
export default function RegisterPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({
    name: '', username: '', email: '',
    password: '', password_confirmation: ''
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  /**
   * Handle submit registrasi.
   * Jika berhasil, simpan token dan redirect ke feed.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const res = await api.post('/register', form)
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        setErrors({ general: err.response?.data?.message || 'Registrasi gagal' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0" style={{ borderRadius: 16 }}>
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <i className="bi bi-twitter-x" style={{ fontSize: '2.5rem', color: '#1d9bf0' }}></i>
                <h2 className="mt-2 fw-bold">Buat Akun Baru</h2>
              </div>

              {errors.general && (
                <div className="alert alert-danger">{errors.general}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Nama lengkap */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nama Lengkap</label>
                  <input
                    type="text"
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                </div>

                {/* Username */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Username</label>
                  <div className="input-group">
                    <span className="input-group-text">@</span>
                    <input
                      type="text"
                      name="username"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      placeholder="johndoe"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                    {errors.username && <div className="invalid-feedback">{errors.username[0]}</div>}
                  </div>
                  <small className="text-muted">Hanya huruf, angka, dan underscore</small>
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="email@contoh.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email[0]}</div>}
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Minimal 8 karakter"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password[0]}</div>}
                </div>

                {/* Konfirmasi password */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Konfirmasi Password</label>
                  <input
                    type="password"
                    name="password_confirmation"
                    className="form-control"
                    placeholder="Ulangi password"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                  style={{ borderRadius: 20 }}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                  {loading ? 'Mendaftar...' : 'Daftar'}
                </button>
              </form>

              <hr />
              <p className="text-center mb-0">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-primary fw-semibold">Masuk</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
