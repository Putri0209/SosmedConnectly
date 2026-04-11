import React, { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'

/**
 * AdminComments - Halaman admin untuk meninjau dan memoderasi komentar.
 *
 * Fitur:
 * - Filter komentar berdasarkan status (semua, flagged, active, rejected)
 * - Approve komentar yang di-flag
 * - Reject komentar dengan alasan
 */
export default function AdminComments() {
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('flagged')
  const [rejectModal, setRejectModal] = useState({ show: false, commentId: null, reason: '' })
  const [actionLoading, setActionLoading] = useState(null)

  /**
   * Mengambil komentar dari API admin berdasarkan filter status.
   *
   * @param {string} status Filter status komentar
   */
  const fetchComments = useCallback(async (status = 'flagged') => {
    setLoading(true)
    try {
      const res = await api.get('/admin/comments', { params: { status } })
      setComments(res.data.data || [])
    } catch (err) {
      console.error('Gagal memuat komentar:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComments(filter)
  }, [filter, fetchComments])

  /** Menyetujui komentar yang di-flag */
  const handleApprove = async (commentId) => {
    setActionLoading(commentId)
    try {
      await api.put(`/admin/comments/${commentId}/approve`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      alert('Gagal approve: ' + (err.response?.data?.message || 'Error'))
    } finally {
      setActionLoading(null)
    }
  }

  /** Menolak komentar dengan alasan */
  const handleReject = async () => {
    if (!rejectModal.reason.trim()) return alert('Masukkan alasan penolakan')
    setActionLoading(rejectModal.commentId)
    try {
      await api.put(`/admin/comments/${rejectModal.commentId}/reject`, {
        reason: rejectModal.reason
      })
      setComments(prev => prev.filter(c => c.id !== rejectModal.commentId))
      setRejectModal({ show: false, commentId: null, reason: '' })
    } catch (err) {
      alert('Gagal reject: ' + (err.response?.data?.message || 'Error'))
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleString('id-ID')

  const statusBadge = {
    active:   <span className="badge bg-success">Aktif</span>,
    flagged:  <span className="badge bg-warning text-dark">Ditandai</span>,
    rejected: <span className="badge bg-danger">Ditolak</span>,
  }

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4">
        <i className="bi bi-chat-dots me-2 text-warning"></i>Moderasi Komentar
      </h3>

      {/* Filter tabs */}
      <div className="btn-group mb-4">
        {['flagged', 'active', 'rejected', 'all'].map(s => (
          <button
            key={s}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'flagged' ? '⚠️ Ditandai' :
             s === 'active'  ? '✅ Aktif'    :
             s === 'rejected'? '❌ Ditolak'  : '📋 Semua'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner-border text-primary" /></div>
      ) : comments.length === 0 ? (
        <div className="alert alert-info text-center">
          Tidak ada komentar dengan status "{filter}"
        </div>
      ) : (
        <div className="row g-3">
          {comments.map(comment => (
            <div key={comment.id} className="col-12">
              <div
                className={`card border-0 shadow-sm ${comment.status === 'flagged' ? 'border-start border-warning border-3' : ''}`}
                style={{ borderRadius: 12 }}
              >
                <div className="card-body">
                  {/* Info user */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-placeholder-sm">
                        {comment.user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <strong>{comment.user?.name}</strong>
                        <span className="text-muted ms-2">@{comment.user?.username}</span>
                        <span className="text-muted ms-2 small">
                          — pada post ID #{comment.post_id}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      {statusBadge[comment.status]}
                      <small className="text-muted">{formatDate(comment.created_at)}</small>
                    </div>
                  </div>

                  {/* Konten komentar */}
                  <p className="mb-2 p-2 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </p>

                  {/* Alasan flag */}
                  {comment.flag_reason && (
                    <div className="flagged-alert mb-2">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      <strong>Alasan:</strong> {comment.flag_reason}
                    </div>
                  )}

                  {/* Aksi moderasi */}
                  {comment.status !== 'rejected' && (
                    <div className="d-flex gap-2 mt-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(comment.id)}
                        disabled={actionLoading === comment.id}
                      >
                        <i className="bi bi-check-circle me-1"></i>Setujui
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setRejectModal({ show: true, commentId: comment.id, reason: '' })}
                        disabled={actionLoading === comment.id}
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

      {/* Modal reject */}
      {rejectModal.show && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tolak Komentar</h5>
                <button
                  className="btn-close"
                  onClick={() => setRejectModal({ show: false, commentId: null, reason: '' })}
                />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Alasan Penolakan</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Tuliskan alasan penolakan..."
                  value={rejectModal.reason}
                  onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setRejectModal({ show: false, commentId: null, reason: '' })}
                >Batal</button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                >Tolak Komentar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
