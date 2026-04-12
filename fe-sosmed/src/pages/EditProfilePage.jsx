import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/axios'

/**
 * EditProfilePage - Halaman untuk mengedit profil user.
 *
 * Fitur:
 * - Update nama dan bio
 * - Upload foto profil baru dengan preview real-time
 * - Validasi client-side dan server-side
 * - Setelah update, data user di AuthContext juga diperbarui
 */
export default function EditProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [form, setForm]     = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  })
  const [avatar, setAvatar]     = useState(null)
  const [preview, setPreview]   = useState(user?.avatar_url || null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')
  const [errors, setErrors]     = useState({})

  /**
   * Handle pemilihan file avatar baru.
   * Membuat preview URL untuk ditampilkan sebelum upload.
   */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      // Buat URL sementara untuk preview
      setPreview(URL.createObjectURL(file))
    }
  }

  /**
   * Submit form update profil.
   * Menggunakan FormData karena menyertakan file upload (avatar).
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('bio', form.bio || '')
      if (avatar) {
        formData.append('avatar', avatar)
      }

      const res = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Update state global user di AuthContext
      updateUser(res.data.user)
      setSuccess('Profil berhasil diupdate!')
      setAvatar(null)

      // Redirect ke profil setelah 1.5 detik
      setTimeout(() => navigate(`/profile/${res.data.user.username}`), 1500)
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        setErrors({ general: err.response?.data?.message || 'Gagal update profil' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-4">
              <h4 className="fw-bold mb-4">
                <i className="bi bi-person-gear me-2"></i>Edit Profil
              </h4>

              {success && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>{success}
                </div>
              )}
              {errors.general && (
                <div className="alert alert-danger">{errors.general}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Avatar upload */}
                <div className="text-center mb-4">
                  <div
                    style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                    onClick={() => fileRef.current?.click()}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="avatar preview"
                        style={{
                          width: 100, height: 100, borderRadius: '50%',
                          objectFit: 'cover', border: '3px solid #1d9bf0'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 100, height: 100, borderRadius: '50%',
                          background: '#1d9bf0', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '2rem', fontWeight: 700
                        }}
                      >
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    {/* Overlay edit icon */}
                    <div
                      style={{
                        position: 'absolute', bottom: 0, right: 0,
                        background: '#1d9bf0', borderRadius: '50%',
                        width: 30, height: 30, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white'
                      }}
                    >
                      <i className="bi bi-camera-fill text-white" style={{ fontSize: '0.75rem' }}></i>
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    className="d-none"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-muted small mt-2">Klik untuk ganti foto profil</p>
                  {errors.avatar && (
                    <div className="text-danger small">{errors.avatar[0]}</div>
                  )}
                </div>

                {/* Nama */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nama Lengkap</label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Bio</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Ceritakan tentang dirimu..."
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    maxLength={500}
                  />
                  <div className="text-muted small text-end">{form.bio.length}/500</div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1"
                    disabled={loading}
                    style={{ borderRadius: 20 }}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    style={{ borderRadius: 20 }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
