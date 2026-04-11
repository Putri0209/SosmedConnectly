import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import PostCard from '../components/PostCard'

/**
 * ProfilePage - Halaman profil user publik.
 *
 * Menampilkan:
 * - Foto profil, nama, username, dan bio user
 * - Semua post yang dibuat user tersebut (terbaru di atas)
 * - Tombol "Edit Profil" jika melihat profil sendiri
 *
 * @param {string} username dari URL params
 */
export default function ProfilePage() {
  const { username }      = useParams()
  const { user: authUser } = useAuth()
  const navigate          = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  /**
   * Ambil data profil dan post user dari API saat username berubah.
   */
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/users/${username}`)
        setProfile(res.data.user)
        setPosts(res.data.posts.data || [])
        setIsFollowing(res.data.user.is_following || false)
      } catch (err) {
        if (err.response?.status === 404) {
          setError('User tidak ditemukan.')
        } else {
          setError('Gagal memuat profil.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  const isOwnProfile = authUser?.username === username

  const handleToggleFollow = async () => {
    if (!authUser) return navigate('/login')
    setFollowLoading(true)
    try {
      const res = await api.post(`/users/${username}/follow`)
      setIsFollowing(res.data.is_following)
      setProfile(prev => ({
        ...prev,
        followers_count: res.data.followers_count
      }))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses follow/unfollow')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) return (
    <div className="loading-spinner">
      <div className="spinner-border text-primary" role="status" />
    </div>
  )

  if (error) return (
    <div className="container py-5">
      <div className="alert alert-danger text-center">{error}</div>
    </div>
  )

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-7">
          {/* Header profil */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-start gap-4">
                {/* Avatar profil */}
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: '#1d9bf0', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '2rem', fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {profile?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}

                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h4 className="mb-0 fw-bold">{profile?.name}</h4>
                      <span className="text-muted">@{profile?.username}</span>
                      {profile?.role === 'admin' && (
                        <span className="badge bg-danger ms-2">Admin</span>
                      )}
                    </div>
                    {isOwnProfile ? (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        style={{ borderRadius: 20 }}
                        onClick={() => navigate('/profile/edit')}
                      >
                        <i className="bi bi-pencil me-1"></i>Edit Profil
                      </button>
                    ) : (
                      <button
                        className={`btn btn-sm ${isFollowing ? 'btn-outline-secondary' : 'btn-primary'}`}
                        style={{ borderRadius: 20, minWidth: 100 }}
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                      >
                        {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 mb-0 text-muted">
                    {profile?.bio || <em>Belum ada bio</em>}
                  </p>
                </div>
              </div>

              {/* Statistik */}
              <div className="d-flex gap-4 mt-3 pt-3 border-top">
                <div>
                  <strong>{posts.length}</strong>
                  <span className="text-muted ms-1 small">Post</span>
                </div>
                <div>
                  <strong>{profile?.followers_count || 0}</strong>
                  <span className="text-muted ms-1 small">Pengikut</span>
                </div>
                <div>
                  <strong>{profile?.followings_count || 0}</strong>
                  <span className="text-muted ms-1 small">Mengikuti</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daftar post user */}
          <h6 className="fw-bold mb-3">
            <i className="bi bi-grid-3x3-gap me-2"></i>Postingan
          </h6>
          {posts.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-chat-square-text" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">Belum ada postingan</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                onUpdated={(updated) => setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))}
                onHashtagFilter={() => {}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
