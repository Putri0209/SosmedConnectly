import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/axios'
import CommentSection from './CommentSection'

/**
 * Mengurai teks dan mengubah hashtag menjadi elemen yang bisa diklik.
 *
 * @param {string} text Konten post/komentar
 * @param {Function} onHashtagClick Callback saat hashtag diklik
 * @returns {React.ReactNode[]} Array elemen teks dan span hashtag
 */
function parseHashtags(text, onHashtagClick) {
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span
          key={i}
          className="hashtag"
          onClick={() => onHashtagClick(part.slice(1))}
        >
          {part}
        </span>
      )
    }
    return part
  })
}

/**
 * MediaGallery - Menampilkan gambar dan file yang dilampirkan pada post/komentar.
 *
 * @param {Array} media Daftar media dari API
 */
function MediaGallery({ media }) {
  if (!media || media.length === 0) return null

  const images = media.filter(m => m.media_type === 'image')
  const files  = media.filter(m => m.media_type === 'file')

  return (
    <div className="mt-2">
      {/* Grid gambar */}
      {images.length > 0 && (
        <div className={`media-grid count-${Math.min(images.length, 4)}`}>
          {images.slice(0, 4).map((img, i) => (
            <img
              key={i}
              src={img.url || storageUrl(img.file_path)}
              alt={img.file_name}
              onClick={() => window.open(img.url || storageUrl(img.file_path), '_blank')}
            />
          ))}
        </div>
      )}

      {/* File attachments */}
      {files.length > 0 && (
        <div className="mt-2">
          {files.map((file, i) => (
            <a
              key={i}
              href={file.url || storageUrl(file.file_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary btn-sm me-2 mb-1"
            >
              <i className="bi bi-file-earmark me-1"></i>
              {file.file_name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * PostCard - Komponen untuk menampilkan satu postingan lengkap.
 *
 * Fitur:
 * - Menampilkan konten, media, hashtag, dan info user
 * - Tombol edit dan delete untuk post milik sendiri
 * - Alert jika post di-flag/rejected
 * - Toggle tampilan komentar
 *
 * @param {Object} post Data post dari API
 * @param {Function} onDeleted Callback saat post berhasil dihapus
 * @param {Function} onUpdated Callback saat post berhasil diupdate
 * @param {Function} onHashtagFilter Callback saat hashtag diklik untuk filter
 */
export default function PostCard({ post, onDeleted, onUpdated, onHashtagFilter }) {
  const { user }          = useAuth()
  const navigate          = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing]           = useState(false)
  const [editContent, setEditContent]   = useState(post.content)
  const [editLoading, setEditLoading]   = useState(false)
  const [editError, setEditError]       = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isOwner = user?.id === post.user_id
  const charLeft = 250 - editContent.length

  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)

  const handleToggleLike = async () => {
    try {
      const res = await api.post(`/posts/${post.id}/like`)
      setIsLiked(res.data.is_liked)
      setLikesCount(res.data.likes_count)
    } catch (err) {
      console.error('Failed to toggle like', err)
    }
  }

  /**
   * Menghapus post setelah konfirmasi user.
   * Memanggil onDeleted callback untuk menghapus post dari daftar.
   */
  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus post ini?')) return
    setDeleteLoading(true)
    try {
      await api.delete(`/posts/${post.id}`)
      onDeleted(post.id)
    } catch (err) {
      alert('Gagal menghapus post: ' + (err.response?.data?.message || 'Error'))
    } finally {
      setDeleteLoading(false)
    }
  }

  /**
   * Menyimpan perubahan edit post.
   * Menggunakan POST method karena browser tidak support FormData dengan PUT.
   */
  const handleUpdate = async () => {
    if (!editContent.trim()) return
    if (editContent.length > 250) return setEditError('Maksimum 250 karakter')
    setEditLoading(true)
    setEditError('')
    try {
      const formData = new FormData()
      formData.append('content', editContent)
      const res = await api.post(`/posts/${post.id}`, formData)
      onUpdated(res.data.post)
      setEditing(false)
      if (res.data.is_flagged) {
        alert('Post diupdate namun ditandai karena mengandung konten tidak pantas.')
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Gagal mengupdate post')
    } finally {
      setEditLoading(false)
    }
  }

  /**
   * Format waktu relatif (misal: "2 jam lalu").
   *
   * @param {string} dateStr Timestamp string dari API
   * @returns {string} Waktu dalam format relatif
   */
  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60)    return 'Baru saja'
    if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
  }

  return (
    <div className={`post-card p-3 mb-3 ${post.status === 'flagged' ? 'border-warning' : ''}`}>
      {/* Header post: avatar + nama + waktu + menu aksi */}
      <div className="d-flex justify-content-between align-items-start">
        <div
          className="d-flex gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${post.user?.username}`)}
          style={{ cursor: 'pointer' }}
        >
          {post.user?.avatar_url ? (
            <img src={post.user.avatar_url} alt="avatar" className="avatar" />
          ) : (
            <div className="avatar-placeholder">
              {post.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <strong>{post.user?.name}</strong>
            <span className="text-muted ms-2 small">@{post.user?.username}</span>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
              {timeAgo(post.created_at)}
            </div>
          </div>
        </div>

        {/* Menu aksi hanya untuk pemilik post */}
        {isOwner && (
          <div className="dropdown">
            <button className="btn btn-sm btn-light" data-bs-toggle="dropdown">
              <i className="bi bi-three-dots"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" onClick={() => setEditing(!editing)}>
                  <i className="bi bi-pencil me-2"></i>Edit
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  <i className="bi bi-trash me-2"></i>
                  {deleteLoading ? 'Menghapus...' : 'Hapus'}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Alert flagged/rejected */}
      {post.is_flagged && post.status !== 'rejected' && (
        <div className="alert alert-warning py-1 px-2 mt-2" style={{ fontSize: '0.85rem' }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Postingan ini mengandung kata kasar</strong>
        </div>
      )}
      {post.status === 'rejected' && (
        <div className="flagged-alert mt-2">
          <i className="bi bi-x-circle me-1"></i>
          <strong>Post ini ditolak admin</strong> — {post.flag_reason}
        </div>
      )}

      {/* Konten post atau form edit */}
      <div className="mt-2">
        {editing ? (
          <div>
            <textarea
              className="form-control"
              rows={3}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              maxLength={250}
            />
            <div className={`char-counter text-end mt-1 ${charLeft < 20 ? 'danger' : ''}`}>
              {charLeft} karakter tersisa
            </div>
            {editError && <div className="text-danger small">{editError}</div>}
            <div className="d-flex gap-2 mt-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleUpdate}
                disabled={editLoading || editContent.length > 250}
              >
                {editLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setEditing(false); setEditContent(post.content) }}
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
            {parseHashtags(post.content, onHashtagFilter)}
          </p>
        )}
      </div>

      {/* Media (gambar dan file) */}
      <MediaGallery media={post.media} />

      {/* Action bar */}
      <div className="d-flex gap-2 mt-3">
        <button
          className="post-action-btn"
          onClick={handleToggleLike}
          style={{ color: isLiked ? '#f91880' : 'inherit' }}
        >
          <i className={isLiked ? "bi bi-heart-fill" : "bi bi-heart"}></i>
          <span>{likesCount}</span>
        </button>
        <button
          className="post-action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <i className="bi bi-chat"></i>
          <span>{post.comments?.length || 0}</span>
        </button>
      </div>

      {/* Section komentar (toggle) */}
      {showComments && (
        <CommentSection
          postId={post.id}
          initialComments={post.comments || []}
          onHashtagFilter={onHashtagFilter}
        />
      )}
    </div>
  )
}
