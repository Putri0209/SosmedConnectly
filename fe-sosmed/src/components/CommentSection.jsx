import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

/**
 * Mengurai hashtag dalam teks menjadi elemen yang bisa diklik.
 *
 * @param {string} text Teks komentar
 * @param {Function} onHashtagClick Handler klik hashtag
 */
function parseHashtags(text, onHashtagClick) {
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="hashtag" onClick={() => onHashtagClick(part.slice(1))}>
          {part}
        </span>
      )
    }
    return part
  })
}

/**
 * CommentItem - Menampilkan satu komentar beserta aksi edit/hapus.
 *
 * @param {Object} comment Data komentar
 * @param {Function} onDeleted Callback hapus komentar
 * @param {Function} onUpdated Callback update komentar
 * @param {Function} onHashtagFilter Filter hashtag
 */
function CommentItem({ comment, onDeleted, onUpdated, onHashtagFilter }) {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [editing, setEditing]       = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [loading, setLoading]       = useState(false)

  const isOwner = user?.id === comment.user_id
  const charLeft = 250 - editContent.length

  /** Format waktu relatif */
  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60)    return 'Baru saja'
    if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
  }

  /** Hapus komentar */
  const handleDelete = async () => {
    if (!window.confirm('Hapus komentar ini?')) return
    try {
      await api.delete(`/comments/${comment.id}`)
      onDeleted(comment.id)
    } catch (err) {
      alert('Gagal menghapus: ' + (err.response?.data?.message || 'Error'))
    }
  }

  /** Simpan edit komentar */
  const handleUpdate = async () => {
    if (!editContent.trim() || editContent.length > 250) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('content', editContent)
      const res = await api.post(`/comments/${comment.id}`, formData)
      onUpdated(res.data.comment)
      setEditing(false)
    } catch (err) {
      alert('Gagal update: ' + (err.response?.data?.message || 'Error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`comment-item ps-2 ${comment.is_flagged ? 'border-start border-warning' : ''}`}>
      <div className="d-flex gap-2 align-items-start">
        {/* Avatar komentar */}
        <div 
          onClick={() => navigate(`/profile/${comment.user?.username}`)} 
          style={{ cursor: 'pointer' }}
        >
          {comment.user?.avatar_url ? (
            <img src={comment.user.avatar_url} alt="avatar" className="avatar-sm" />
          ) : (
            <div className="avatar-placeholder-sm">
              {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="flex-grow-1">
          {/* Nama user dan waktu */}
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong 
                onClick={() => navigate(`/profile/${comment.user?.username}`)}
                style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                className="text-dark"
              >
                {comment.user?.name}
              </strong>
              <span 
                className="text-muted ms-1" 
                style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${comment.user?.username}`)}
              >
                @{comment.user?.username}
              </span>
              <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                {timeAgo(comment.created_at)}
              </span>
            </div>
            {/* Aksi edit/hapus hanya untuk pemilik */}
            {isOwner && (
              <div className="dropdown">
                <button className="btn btn-sm" data-bs-toggle="dropdown" style={{ padding: '0 4px' }}>
                  <i className="bi bi-three-dots" style={{ fontSize: '0.8rem' }}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button className="dropdown-item small" onClick={() => setEditing(!editing)}>
                      <i className="bi bi-pencil me-2"></i>Edit
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item small text-danger" onClick={handleDelete}>
                      <i className="bi bi-trash me-2"></i>Hapus
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Alert flagged komentar */}
          {comment.is_flagged && (
            <div className="flagged-alert mt-1 mb-1">
              <i className="bi bi-exclamation-triangle me-1"></i>
              Komentar ini sedang ditinjau — {comment.flag_reason}
            </div>
          )}

          {/* Konten komentar atau form edit */}
          {editing ? (
            <div>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                maxLength={250}
              />
              <div className={`char-counter text-end ${charLeft < 20 ? 'danger' : ''}`}>
                {charLeft} sisa
              </div>
              <div className="d-flex gap-2 mt-1">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <p className="mb-1" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
              {parseHashtags(comment.content, onHashtagFilter)}
            </p>
          )}

          {/* Media komentar */}
          {comment.media?.length > 0 && (
            <div className="mt-1">
              {comment.media.filter(m => m.media_type === 'image').map((img, i) => (
                <img
                  key={i}
                  src={img.url || `/storage/${img.file_path}`}
                  alt={img.file_name}
                  style={{ maxHeight: '150px', borderRadius: '8px', cursor: 'pointer' }}
                  className="me-1"
                  onClick={() => window.open(img.url || `/storage/${img.file_path}`, '_blank')}
                />
              ))}
              {comment.media.filter(m => m.media_type === 'file').map((file, i) => (
                <a
                  key={i}
                  href={file.url || `/storage/${file.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-secondary btn-sm me-1 mt-1"
                >
                  <i className="bi bi-file-earmark me-1"></i>{file.file_name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * CommentSection - Menampilkan daftar komentar dan form tambah komentar.
 *
 * Fitur:
 * - Menampilkan daftar komentar yang sudah ada
 * - Form untuk menambah komentar baru (teks + gambar + file)
 * - Real-time update daftar setelah tambah/hapus/edit komentar
 *
 * @param {number} postId ID post yang dikomentari
 * @param {Array} initialComments Daftar komentar awal dari post
 * @param {Function} onHashtagFilter Handler filter hashtag
 */
export default function CommentSection({ postId, initialComments, onHashtagFilter }) {
  const { user }   = useAuth()
  const [comments, setComments] = useState(initialComments || [])
  const [content, setContent]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const imageRef = useRef(null)
  const fileRef  = useRef(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [selectedFiles,  setSelectedFiles]  = useState([])
  const charLeft = 250 - content.length

  /**
   * Mengirim komentar baru ke API.
   * Menggunakan FormData untuk mendukung upload file.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    if (content.length > 250) return setError('Maksimum 250 karakter')
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('content', content)
      selectedImages.forEach(img => formData.append('images[]', img))
      selectedFiles.forEach(f => formData.append('files[]', f))

      const res = await api.post(`/posts/${postId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Tambahkan komentar baru ke atas daftar
      setComments(prev => [res.data.comment, ...prev])
      setContent('')
      setSelectedImages([])
      setSelectedFiles([])
      if (imageRef.current) imageRef.current.value = ''
      if (fileRef.current)  fileRef.current.value  = ''

      if (res.data.is_flagged) {
        alert('Komentar berhasil dikirim namun sedang ditinjau karena mengandung konten tidak pantas.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim komentar')
    } finally {
      setLoading(false)
    }
  }

  /** Hapus komentar dari daftar lokal */
  const handleDeleted = (id) => {
    setComments(prev => prev.filter(c => c.id !== id))
  }

  /** Update komentar di daftar lokal */
  const handleUpdated = (updated) => {
    setComments(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  return (
    <div className="comment-section">
      {/* Form tambah komentar */}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="d-flex gap-2">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="avatar-sm" />
          ) : (
            <div className="avatar-placeholder-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-grow-1">
            <textarea
              className="form-control form-control-sm"
              rows={2}
              placeholder="Tulis komentar... (gunakan #hashtag)"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={250}
            />
            <div className={`char-counter text-end mt-1 ${charLeft < 20 ? 'danger' : ''}`}>
              {charLeft} karakter tersisa
            </div>

            {/* Upload gambar dan file */}
            <div className="d-flex gap-2 mt-1 align-items-center">
              <label className="btn btn-outline-secondary btn-sm" title="Lampirkan gambar">
                <i className="bi bi-image"></i>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="d-none"
                  onChange={e => setSelectedImages(Array.from(e.target.files))}
                />
              </label>
              <label className="btn btn-outline-secondary btn-sm" title="Lampirkan file">
                <i className="bi bi-paperclip"></i>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="d-none"
                  onChange={e => setSelectedFiles(Array.from(e.target.files))}
                />
              </label>
              {selectedImages.length > 0 && (
                <small className="text-muted">{selectedImages.length} gambar</small>
              )}
              {selectedFiles.length > 0 && (
                <small className="text-muted">{selectedFiles.length} file</small>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-sm ms-auto"
                disabled={loading || !content.trim() || content.length > 250}
              >
                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Kirim'}
              </button>
            </div>
            {error && <div className="text-danger small mt-1">{error}</div>}
          </div>
        </div>
      </form>

      {/* Daftar komentar */}
      {comments.length === 0 ? (
        <p className="text-muted small text-center">Belum ada komentar. Jadilah yang pertama!</p>
      ) : (
        comments
          .filter(c => c.status !== 'rejected')
          .map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
              onHashtagFilter={onHashtagFilter}
            />
          ))
      )}
    </div>
  )
}
