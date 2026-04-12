import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Navbar - Komponen navigasi utama untuk halaman user.
 *
 * Menampilkan:
 * - Logo/brand di kiri
 * - Link navigasi: Beranda, Mengikuti, Notifikasi
 * - Avatar dan dropdown user menu (Profil, Logout)
 *
 * Catatan: Navbar TIDAK tampil di halaman admin.
 * Halaman admin menggunakan AdminSidebar tersendiri.
 */
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

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
              {/* Links navigasi user */}
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
              </ul>

              {/* User dropdown menu */}
              <div className="d-flex align-items-center gap-3">
                <div className="dropdown">
                  <button
                    className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                    style={{ borderRadius: '20px' }}
                  >
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
