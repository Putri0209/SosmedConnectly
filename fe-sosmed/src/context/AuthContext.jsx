import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/axios'

/**
 * AuthContext - Context untuk menyimpan dan menyebarkan state autentikasi
 * ke seluruh komponen aplikasi tanpa prop drilling.
 *
 * State yang dikelola:
 * - user: data user yang sedang login (null jika belum login)
 * - token: Bearer token untuk API request
 * - loading: status loading saat pengecekan autentikasi awal
 */
const AuthContext = createContext(null)

/**
 * AuthProvider - Provider component yang membungkus seluruh aplikasi.
 * Menyediakan fungsi login, logout, dan updateUser ke seluruh child component.
 *
 * @param {React.ReactNode} children
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  /**
   * Cek autentikasi saat aplikasi pertama kali dimuat.
   * Jika ada token di localStorage, verifikasi ke backend.
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser  = localStorage.getItem('user')

      if (savedToken && savedUser) {
        try {
          // Verifikasi token ke backend
          const res = await api.get('/me')
          setUser(res.data)
          setToken(savedToken)
        } catch {
          // Token tidak valid, bersihkan localStorage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  /**
   * Fungsi login - menyimpan token dan data user ke state dan localStorage.
   *
   * @param {string} newToken Bearer token dari response API
   * @param {Object} newUser Data user dari response API
   */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  /**
   * Fungsi logout - menghapus token, memanggil API logout, redirect ke login.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // Abaikan error logout (token mungkin sudah expired)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }
  }, [])

  /**
   * Update data user setelah edit profil.
   *
   * @param {Object} updatedUser Data user yang baru
   */
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook untuk menggunakan AuthContext.
 * Melempar error jika digunakan di luar AuthProvider.
 *
 * @returns {Object} Nilai dari AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }
  return context
}
