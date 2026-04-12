import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Halaman utama
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import FeedPage      from './pages/FeedPage'
import ProfilePage   from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import NotificationsPage from './pages/NotificationsPage'

// Halaman admin
import AdminDashboard   from './pages/admin/AdminDashboard'
import AdminPosts       from './pages/admin/AdminPosts'
import AdminComments    from './pages/admin/AdminComments'
import AdminBadWords    from './pages/admin/AdminBadWords'

// Layout
import Navbar from './components/Navbar'
import AdminLayout from './components/AdminLayout'

/**
 * ProtectedRoute - HOC untuk melindungi route yang membutuhkan autentikasi.
 * Jika user belum login, redirect ke halaman login.
 *
 * @param {React.ReactNode} children Komponen yang dilindungi
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/**
 * AdminRoute - HOC untuk melindungi route khusus admin.
 * Redirect ke feed jika bukan admin.
 *
 * @param {React.ReactNode} children Komponen admin
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <AdminLayout>{children}</AdminLayout>
}

/**
 * AppRoutes - Mendefinisikan semua routing aplikasi.
 * Terpisah dari App agar bisa menggunakan useAuth (membutuhkan AuthProvider).
 */
function AppRoutes() {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')
  return (
    <>
      {!isAdminPage && <Navbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected user routes */}
        <Route path="/" element={
          <ProtectedRoute><FeedPage type="all" /></ProtectedRoute>
        } />
        <Route path="/following" element={
          <ProtectedRoute><FeedPage type="following" /></ProtectedRoute>
        } />
        <Route path="/profile/:username" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/profile/edit" element={
          <ProtectedRoute><EditProfilePage /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><NotificationsPage /></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />
        <Route path="/admin/posts" element={
          <AdminRoute><AdminPosts /></AdminRoute>
        } />
        <Route path="/admin/comments" element={
          <AdminRoute><AdminComments /></AdminRoute>
        } />
        <Route path="/admin/bad-words" element={
          <AdminRoute><AdminBadWords /></AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

/**
 * App - Komponen root yang membungkus AuthProvider dan Router.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
