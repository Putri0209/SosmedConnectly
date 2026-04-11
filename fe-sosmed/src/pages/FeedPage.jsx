import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import ComposePost from '../components/ComposePost'
import PostCard from '../components/PostCard'

/**
 * FeedPage - Halaman utama (timeline) yang menampilkan semua postingan.
 *
 * Fitur:
 * - Menampilkan semua post diurutkan terbaru
 * - Filter post berdasarkan hashtag (dari klik hashtag atau input manual)
 * - Infinite scroll / load more dengan pagination
 * - Form buat post baru (ComposePost)
 * - Sidebar trending hashtags
 */
export default function FeedPage({ type = 'all' }) {
  const [posts, setPosts]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [error, setError]               = useState('')
  const [hashtagFilter, setHashtagFilter] = useState('')
  const [hashtagInput, setHashtagInput] = useState('')
  const [page, setPage]                 = useState(1)
  const [hasMore, setHasMore]           = useState(true)

  /**
   * Mengambil postingan dari API.
   * Mendukung pagination, filter hashtag, dan tipe feed (all/following).
   *
   * @param {number} pageNum Nomor halaman yang dimuat
   * @param {string} hashtag Filter hashtag (opsional)
   * @param {boolean} reset Jika true, reset daftar post (bukan append)
   * @param {string} type Tipe feed ('all' atau 'following')
   */
  const fetchPosts = useCallback(async (pageNum = 1, hashtag = '', reset = false, type = 'all') => {
    try {
      const params = { page: pageNum }
      if (hashtag) params.hashtag = hashtag
      if (type === 'following') params.feed = 'following'

      const res = await api.get('/posts', { params })
      const newPosts = res.data.data || []

      if (reset) {
        // Reset daftar ketika ganti filter atau refresh
        setPosts(newPosts)
      } else {
        // Append untuk load more
        setPosts(prev => [...prev, ...newPosts])
      }

      // Cek apakah masih ada halaman berikutnya
      setHasMore(res.data.current_page < res.data.last_page)
      setPage(res.data.current_page)
    } catch (err) {
      setError('Gagal memuat postingan. Coba lagi.')
    }
  }, [])

  // Load awal saat komponen mount atau type/hashtagFilter berubah
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchPosts(1, hashtagFilter, true, type)
      setLoading(false)
    }
    init()
  }, [type, hashtagFilter, fetchPosts])

  /**
   * Handle filter hashtag dari klik pada hashtag di post/komentar.
   * Mereset pagination dan memuat ulang post dengan filter baru.
   *
   * @param {string} tag Nama hashtag (tanpa '#')
   */
  const handleHashtagFilter = useCallback(async (tag) => {
    setHashtagFilter(tag)
    setHashtagInput(tag)
    setLoading(true)
    await fetchPosts(1, tag, true, type)
    setLoading(false)
  }, [fetchPosts, type])

  /**
   * Handle submit filter hashtag dari input manual.
   */
  const handleHashtagSearch = async (e) => {
    e.preventDefault()
    const tag = hashtagInput.replace('#', '').trim()
    setHashtagFilter(tag)
    setLoading(true)
    await fetchPosts(1, tag, true, type)
    setLoading(false)
  }

  /**
   * Menghapus filter hashtag dan kembali ke feed penuh.
   */
  const clearFilter = async () => {
    setHashtagFilter('')
    setHashtagInput('')
    setLoading(true)
    await fetchPosts(1, '', true, type)
    setLoading(false)
  }

  /**
   * Load more - memuat halaman berikutnya dari feed.
   */
  const handleLoadMore = async () => {
    setLoadingMore(true)
    await fetchPosts(page + 1, hashtagFilter, false, type)
    setLoadingMore(false)
  }

  /**
   * Callback saat post baru berhasil dibuat.
   * Menambahkan post baru ke paling atas daftar.
   *
   * @param {Object} newPost Data post yang baru dibuat
   */
  const handlePostCreated = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev])
  }, [])

  /**
   * Callback saat post dihapus.
   * Menghapus post dari daftar lokal tanpa reload.
   *
   * @param {number} postId ID post yang dihapus
   */
  const handlePostDeleted = useCallback((postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }, [])

  /**
   * Callback saat post diupdate.
   * Mengganti data post lama dengan yang baru.
   *
   * @param {Object} updatedPost Data post yang sudah diupdate
   */
  const handlePostUpdated = useCallback((updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
  }, [])

  return (
    <div className="container py-4">
      <div className="row">
        {/* Kolom utama feed */}
        <div className="col-lg-8">
          {/* Form buat post baru */}
          {type !== 'following' && (
  <ComposePost onPostCreated={handlePostCreated} />
)}
          {/* Filter hashtag aktif */}
          {hashtagFilter && (
            <div className="alert alert-info d-flex align-items-center justify-content-between mb-3">
              <span>
                <i className="bi bi-hash me-1"></i>
                Menampilkan post dengan <strong>#{hashtagFilter}</strong>
              </span>
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilter}>
                <i className="bi bi-x-circle me-1"></i>Hapus filter
              </button>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
              <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => fetchPosts(1, hashtagFilter, true)}>
                Coba lagi
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Memuat...</span>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-chat-square-text" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">
  {hashtagFilter
    ? `Belum ada post dengan #${hashtagFilter}`
    : type === 'following'
      ? 'Belum ada postingan dari pengguna yang kamu ikuti.'
      : 'Belum ada postingan. Jadilah yang pertama!'}
</p>
            </div>
          ) : (
            <>
              {/* Daftar post */}
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={handlePostDeleted}
                  onUpdated={handlePostUpdated}
                  onHashtagFilter={handleHashtagFilter}
                />
              ))}

              {/* Tombol load more */}
              {hasMore && (
                <div className="text-center py-3">
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{ borderRadius: 20 }}
                  >
                    {loadingMore ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : null}
                    {loadingMore ? 'Memuat...' : 'Muat lebih banyak'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar kanan */}
        <div className="col-lg-4 d-none d-lg-block">
          <div className="sidebar-card">
            {/* Cari hashtag */}
            <h6 className="fw-bold mb-3">
              <i className="bi bi-search me-2"></i>Cari Hashtag
            </h6>
            <form onSubmit={handleHashtagSearch}>
              <div className="input-group">
                <span className="input-group-text">#</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="hashtag..."
                  value={hashtagInput}
                  onChange={e => setHashtagInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Cari</button>
              </div>
            </form>

            <hr />

            {/* Daftar hashtag populer (statis sebagai contoh) */}
            <h6 className="fw-bold mb-3">
              <i className="bi bi-fire me-2 text-danger"></i>Trending
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {['teknologi', 'coding', 'laravel', 'react', 'indonesia', 'programming'].map(tag => (
                <button
                  key={tag}
                  className="btn btn-outline-primary btn-sm"
                  style={{ borderRadius: 20 }}
                  onClick={() => handleHashtagFilter(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
