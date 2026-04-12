import React, { useState, useEffect, useCallback } from 'react'
import api from '../../utils/axios'

/**
 * AdminPosts - Halaman admin untuk meninjau dan memoderasi post.
 *
 * Fitur:
 * - Filter post berdasarkan status (flagged,rejected)
 * - Reject post dengan alasan yang dicatat
 * - Tampilkan konten post, user, dan tanggal
 */
export default function AdminPosts() {
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('flagged') // Default: tampilkan yang perlu ditinjau
  const [rejectModal, setRejectModal] = useState({ show: false, postId: null, reason: '' })
  const [actionLoading, setActionLoading] = useState(null)

  /**
   * Mengambil daftar post dari API admin berdasarkan filter status.
   *
   * @param {string} status Filter status post
   */
  const fetchPosts = useCallback(async (status = 'flagged') => {
    setLoading(true)
    try {
      const res = await api.get('/admin/posts', { params: { status } })
      setPosts(res.data.data || [])
    } catch (err) {
      console.error('Gagal memuat post:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(filter)
  }, [filter, fetchPosts])

  /**
   * Menyetujui (approve) post yang di-flag.
   *
   * @param {number} postId ID post yang di-approve
   */
  const handleApprove = async (postId) => {
    setActionLoading(postId)
    try {
      await api.put(`/admin/posts/${postId}/approve`)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      alert('Gagal approve post: ' + (err.response?.data?.message || 'Error'))
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * Menolak (reject) post dengan alasan.
   * Post akan berstatus 'rejected' dan tidak tampil di feed.
   */
  const handleReject = async () => {
    if (!rejectModal.reason.trim()) return alert('Masukkan alasan penolakan')
    setActionLoading(rejectModal.postId)
    try {
      await api.put(`/admin/posts/${rejectModal.postId}/reject`, {
        reason: rejectModal.reason
      })
      setPosts(prev => prev.filter(p => p.id !== rejectModal.postId))
      setRejectModal({ show: false, postId: null, reason: '' })
    } catch (err) {
      alert('Gagal reject post: ' + (err.response?.data?.message || 'Error'))
    } finally {
      setActionLoading(null)
    }
  }

  /** Format tanggal ke format lokal */
  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('id-ID')

  const statusBadge = {
    flagged:  <span className="badge bg-warning text-dark">Ditandai</span>,
    rejected: <span className="badge bg-danger">Ditolak</span>,
  }

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4">
        <i className="bi bi-file-post me-2 text-danger"></i>Moderasi Post
      </h3>

      {/* Filter tabs */}
      <div className="btn-group mb-4" role="group">
        {['flagged', 'rejected'].map(s => (
          <button
            key={s}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'flagged' ? '⚠️ Ditandai' : '❌ Ditolak'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner-border text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="alert alert-info text-center">
          <i className="bi bi-check-circle me-2"></i>
          Tidak ada post dengan status "{filter}"
        </div>
      ) : (
        <div className="row g-3">
          {posts.map(post => (
            <div key={post.id} className="col-12">
              <div className={`card border-0 shadow-sm ${post.status === 'flagged' ? 'border-start border-warning border-3' : ''}`}
                   style={{ borderRadius: 12 }}>
                <div className="card-body">
                  {/* Header: info user */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-placeholder-sm">
                        {post.user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <strong>{post.user?.name}</strong>
                        <span className="text-muted ms-2">@{post.user?.username}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {statusBadge[post.status]}
                      <small className="text-muted">{formatDate(post.created_at)}</small>
                    </div>
                  </div>

                  {/* Konten post */}
                  <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

                  {/* Alasan flag/reject */}
                  {post.flag_reason && (
                    <div className="flagged-alert mb-2">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      <strong>Alasan:</strong> {post.flag_reason}
                    </div>
                  )}

                  {/* Hashtags */}
                  {post.hashtags?.length > 0 && (
                    <div className="mb-2">
                      {post.hashtags.map(h => (
                        <span key={h.id} className="badge bg-light text-primary me-1">#{h.name}</span>
                      ))}
                    </div>
                  )}

                  {/* Media count */}
                  {post.media?.length > 0 && (
                    <p className="text-muted small mb-2">
                      <i className="bi bi-paperclip me-1"></i>{post.media.length} lampiran
                    </p>
                  )}

                  {/* Aksi moderasi */}
                  {post.status !== 'rejected' && (
                    <div className="d-flex gap-2 mt-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(post.id)}
                        disabled={actionLoading === post.id}
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        {actionLoading === post.id ? 'Memproses...' : 'Setujui'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setRejectModal({ show: true, postId: post.id, reason: '' })}
                        disabled={actionLoading === post.id}
                      >
                        <i className="bi bi-x-circle me-1"></i>Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal konfirmasi reject */}
      {rejectModal.show && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tolak Post</h5>
                <button className="btn-close" onClick={() => setRejectModal({ show: false, postId: null, reason: '' })} />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Alasan Penolakan</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Tuliskan alasan mengapa post ini ditolak..."
                  value={rejectModal.reason}
                  onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                />
                <small className="text-muted">Alasan ini akan ditampilkan kepada pemilik post.</small>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setRejectModal({ show: false, postId: null, reason: '' })}
                >Batal</button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                >
                  {actionLoading ? 'Memproses...' : 'Tolak Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
