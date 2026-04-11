import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Navbar - Komponen navigasi utama aplikasi.
 *
 * Menampilkan:
 * - Logo/brand di kiri
 * - Link navigasi berdasarkan status login dan role user
 * - Avatar dan dropdown user menu
 * - Menu khusus admin jika role adalah 'admin'
 */
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  /**
   * Handle proses logout.
   * Memanggil fungsi logout dari context, lalu redirect ke halaman login.
   */
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
      <div className="container">
        {/* Brand / Logo */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="">
          <i className="bi bi-asterisk" style={{ color: '#1d9bf0' }}></i>
          Connectly
        </Link>

        {/* Toggle untuk mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuthenticated ? (
            <>
              {/* Links untuk user yang sudah login */}
              <ul className="navbar-nav mx-auto gap-3 align-items-center">
                <li className="nav-item mx-5">
                  <Link className="nav-link" to="/">
                    <i className="bi bi-house-fill me-1"></i>Beranda
                  </Link>
                </li>
                <li className="nav-item mx-5">
                  <Link className="nav-link" to="/following">
                    <i className="bi bi-people-fill me-1"></i>Mengikuti
                  </Link>
                </li>
                <li className="nav-item mx-5">
                  <Link className="nav-link" to="/notifications">
                    <i className="bi bi-bell-fill me-1"></i>Notifikasi
                  </Link>
                </li>

                {/* Menu admin hanya tampil jika role admin */}
                {isAdmin && (
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bi bi-shield-fill me-1 text-danger"></i>Admin
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="/admin">
                          <i className="bi bi-speedometer2 me-2"></i>Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/posts">
                          <i className="bi bi-file-post me-2"></i>Kelola Post
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/comments">
                          <i className="bi bi-chat-dots me-2"></i>Kelola Komentar
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/bad-words">
                          <i className="bi bi-slash-circle me-2"></i>Bad Words
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}
              </ul>

              {/* User dropdown menu */}
              <div className="d-flex align-items-center gap-3">
                <div className="dropdown">
                  <button
                    className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                    style={{ borderRadius: '20px' }}
                  >
                    {/* Avatar atau placeholder */}
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="avatar"
                        className="avatar-sm"
                      />
                    ) : (
                      <div className="avatar-placeholder-sm">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="d-none d-md-inline">{user?.name}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link
                        className="dropdown-item"
                        to={`/profile/${user?.username}`}
                      >
                        <i className="bi bi-person me-2"></i>Profil Saya
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            /* Links untuk tamu (belum login) */
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="btn btn-primary btn-sm ms-2" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="btn btn-primary btn-sm ms-2" to="/register">
                  Daftar
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  )
}
