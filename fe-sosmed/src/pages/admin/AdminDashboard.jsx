import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/axios'

/**
 * AdminDashboard - Halaman dashboard admin.
 *
 * Menampilkan statistik platform secara real-time:
 * - Jumlah post yang perlu ditinjau (flagged)
 * - Jumlah komentar yang perlu ditinjau
 * - Total post di platform
 * - Total user terdaftar
 * - Total post dan komentar yang di-reject
 *
 * Quick action: tombol cepat menuju halaman moderasi
 */
export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Mengambil data statistik dari API /admin/dashboard.
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard')
        setStats(res.data.stats)
      } catch (err) {
        console.error('Gagal memuat dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status" />
      </div>
    )
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">
            <i className="bi bi-speedometer2 me-2 text-primary"></i>Admin Dashboard
          </h3>
          <p className="text-muted mb-0">Pantau dan kelola konten platform</p>
        </div>
      </div>

      {/* Statistik cards */}
      <div className="row g-3 mb-4">
        {/* Post perlu ditinjau */}
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)' }}>
            <h2>{stats?.posts_pending_review ?? 0}</h2>
            <p>Post Perlu Ditinjau</p>
            {stats?.posts_pending_review > 0 && (
              <span className="badge bg-white text-danger">Perlu Aksi!</span>
            )}
          </div>
        </div>

        {/* Komentar perlu ditinjau */}
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ffd32a, #f7b731)' }}>
            <h2>{stats?.comments_pending_review ?? 0}</h2>
            <p>Komentar Ditinjau</p>
            {stats?.comments_pending_review > 0 && (
              <span className="badge bg-white text-warning">Perlu Aksi!</span>
            )}
          </div>
        </div>

        {/* Total post */}
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1d9bf0, #0984e3)' }}>
            <h2>{stats?.total_posts ?? 0}</h2>
            <p>Total Post</p>
          </div>
        </div>

        {/* Total user */}
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}>
            <h2>{stats?.total_users ?? 0}</h2>
            <p>Total User</p>
          </div>
        </div>
      </div>

      {/* Baris kedua statistik */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}>
            <h2>{stats?.rejected_posts ?? 0}</h2>
            <p>Post Di-reject</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
            <h2>{stats?.rejected_comments ?? 0}</h2>
            <p>Komentar Di-reject</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h5 className="fw-bold mb-3">Aksi Cepat</h5>
      <div className="row g-3">
        <div className="col-md-4">
          <Link to="/admin/posts" className="card border-0 shadow-sm text-decoration-none" style={{ borderRadius: 12 }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div
                className="rounded-3 p-3"
                style={{ background: '#fff5f5' }}
              >
                <i className="bi bi-file-post fs-3 text-danger"></i>
              </div>
              <div>
                <h6 className="mb-0 text-dark">Kelola Post</h6>
                <small className="text-muted">Review & moderasi post</small>
                {stats?.posts_pending_review > 0 && (
                  <span className="badge bg-danger ms-2">{stats.posts_pending_review}</span>
                )}
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/admin/comments" className="card border-0 shadow-sm text-decoration-none" style={{ borderRadius: 12 }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-3 p-3" style={{ background: '#fff8f0' }}>
                <i className="bi bi-chat-dots fs-3 text-warning"></i>
              </div>
              <div>
                <h6 className="mb-0 text-dark">Kelola Komentar</h6>
                <small className="text-muted">Review & moderasi komentar</small>
                {stats?.comments_pending_review > 0 && (
                  <span className="badge bg-warning text-dark ms-2">{stats.comments_pending_review}</span>
                )}
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/admin/bad-words" className="card border-0 shadow-sm text-decoration-none" style={{ borderRadius: 12 }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-3 p-3" style={{ background: '#f0fff4' }}>
                <i className="bi bi-slash-circle fs-3 text-success"></i>
              </div>
              <div>
                <h6 className="mb-0 text-dark">Bad Words</h6>
                <small className="text-muted">Kelola kata terlarang</small>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
