import React from 'react'
import AdminSidebar from './AdminSidebar'

/**
 * AdminLayout - Layout wrapper untuk semua halaman admin.
 * Menampilkan sidebar di kiri dan konten utama di kanan.
 *
 * @param {React.ReactNode} children Konten halaman admin
 */
export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
