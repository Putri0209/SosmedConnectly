import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * AdminSidebar - Sidebar navigasi khusus halaman admin.
 *
 * Menampilkan:
 * - Logo/brand
 * - Menu navigasi admin (Dashboard, Kelola Post, Kelola Komentar, Bad Words)
 * - Info user & tombol logout
 */
export default function AdminSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    {
      to: '/admin',
      icon: 'bi-speedometer2',
      label: 'Dashboard',
      exact: true,
    },
    {
      to: '/admin/posts',
      icon: 'bi-file-post',
      label: 'Kelola Post',
    },
    {
      to: '/admin/comments',
      icon: 'bi-chat-dots',
      label: 'Kelola Komentar',
    },
    {
      to: '/admin/bad-words',
      icon: 'bi-slash-circle',
      label: 'Bad Words',
    },
  ]

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  return (
    <div className="admin-sidebar d-flex flex-column">
      {/* Brand */}
      <div className="admin-sidebar-brand">
        <i className="bi bi-shield-fill-check me-2"></i>
        <span>Admin Panel</span>
      </div>

      {/* Nav Links */}
      <nav className="admin-sidebar-nav flex-grow-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`admin-sidebar-link ${isActive(item) ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User info & logout */}
      <div className="admin-sidebar-footer">
        <div className="d-flex align-items-center gap-2 mb-3">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="avatar-sm" />
          ) : (
            <div className="avatar-placeholder-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Administrator</div>
          </div>
        </div>
        <button
          className="btn btn-sm w-100 admin-logout-btn"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-2"></i>Logout
        </button>
      </div>
    </div>
  )
}
