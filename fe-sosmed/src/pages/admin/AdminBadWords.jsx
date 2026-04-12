import React, { useState, useEffect } from 'react'
import api from '../../utils/axios'

/**
 * AdminBadWords - Halaman admin untuk mengelola daftar kata terlarang.
 *
 * Fitur:
 * - Menampilkan semua bad words yang terdaftar
 * - Menambah bad word baru
 * - Menghapus bad word yang ada
 * - Kata-kata ini digunakan oleh sistem untuk auto-flag konten
 */
export default function AdminBadWords() {
  const [words, setWords]     = useState([])
  const [loading, setLoading] = useState(true)
  const [newWord, setNewWord] = useState('')
  const [adding, setAdding]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  /**
   * Mengambil daftar bad words dari API.
   */
  useEffect(() => {
    const fetchWords = async () => {
      try {
        const res = await api.get('/admin/bad-words')
        setWords(res.data)
      } catch (err) {
        console.error('Gagal memuat bad words:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWords()
  }, [])

  /**
   * Menambahkan bad word baru ke database.
   * Kata disimpan dalam lowercase untuk konsistensi pengecekan.
   */
  const handleAdd = async (e) => {
    e.preventDefault()
    const word = newWord.trim().toLowerCase()
    if (!word) return

    setAdding(true)
    setError('')
    setSuccess('')

    try {
      const res = await api.post('/admin/bad-words', { word })
      // Tambahkan ke daftar lokal tanpa reload
      setWords(prev => [...prev, res.data.bad_word].sort((a, b) => a.word.localeCompare(b.word)))
      setNewWord('')
      setSuccess(`Kata "${word}" berhasil ditambahkan`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      if (err.response?.data?.errors?.word) {
        setError(err.response.data.errors.word[0])
      } else {
        setError(err.response?.data?.message || 'Gagal menambahkan kata')
      }
    } finally {
      setAdding(false)
    }
  }

  /**
   * Menghapus bad word dari database.
   *
   * @param {number} id ID bad word yang akan dihapus
   * @param {string} word Nama kata (untuk konfirmasi)
   */
  const handleDelete = async (id, word) => {
    if (!window.confirm(`Hapus kata "${word}" dari daftar?`)) return

    try {
      await api.delete(`/admin/bad-words/${id}`)
      setWords(prev => prev.filter(w => w.id !== id))
      setSuccess(`Kata "${word}" berhasil dihapus`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert('Gagal menghapus: ' + (err.response?.data?.message || 'Error'))
    }
  }

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-2">
        <i className="bi bi-slash-circle me-2 text-success"></i>Kelola Bad Words
      </h3>
      <p className="text-muted mb-4">
        Kata-kata dalam daftar ini akan secara otomatis menandai konten untuk ditinjau admin.
      </p>

      {/* Form tambah bad word */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <h6 className="fw-bold mb-3">Tambah Kata Terlarang Baru</h6>
          {success && (
            <div className="alert alert-success py-2 small">
              <i className="bi bi-check-circle me-2"></i>{success}
            </div>
          )}
          {error && (
            <div className="alert alert-danger py-2 small">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}
          <form onSubmit={handleAdd} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Ketik kata terlarang..."
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={adding || !newWord.trim()}
            >
              {adding ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              {adding ? 'Menambahkan...' : 'Tambahkan'}
            </button>
          </form>
          <small className="text-muted mt-1 d-block">
            Kata akan disimpan dalam format lowercase dan dicek dengan word boundary matching.
          </small>
        </div>
      </div>

      {/* Daftar bad words */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            Daftar Kata Terlarang
            <span className="badge bg-secondary ms-2">{words.length}</span>
          </h6>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="loading-spinner"><div className="spinner-border text-primary" /></div>
          ) : words.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-list-check" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2">Belum ada kata terlarang terdaftar</p>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2 p-3">
              {words.map(w => (
                <div
                  key={w.id}
                  className="badge d-flex align-items-center gap-2 py-2 px-3"
                  style={{
                    background: '#fff0f0',
                    color: '#c62828',
                    border: '1px solid #ffcdd2',
                    borderRadius: 20,
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="bi bi-slash-circle"></i>
                  {w.word}
                  <button
                    className="btn btn-sm p-0 ms-1"
                    style={{
                      color: '#c62828', background: 'none',
                      border: 'none', lineHeight: 1, fontSize: '1rem',
                    }}
                    onClick={() => handleDelete(w.id, w.word)}
                    title={`Hapus kata "${w.word}"`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informasi cara kerja */}
      <div className="alert alert-info mt-4">
        <h6 className="alert-heading">
          <i className="bi bi-info-circle me-2"></i>Cara Kerja Filter
        </h6>
        <p className="mb-0 small">
          Sistem secara otomatis memeriksa setiap post dan komentar yang dibuat.
          Jika konten mengandung salah satu kata dalam daftar ini, konten akan langsung
          ditandai (<strong>flagged</strong>) dan user akan mendapat notifikasi.
          Admin kemudian dapat menyetujui atau menolak konten tersebut.
          Pengecekan menggunakan <em>word boundary matching</em> — kata "goblok" tidak akan
          menandai kata "bergoblok-an" (tergantung konteks implementasi regex).
        </p>
      </div>
    </div>
  )
}
