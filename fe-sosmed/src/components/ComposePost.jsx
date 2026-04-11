import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

/**
 * ComposePost - Komponen form untuk membuat postingan baru.
 *
 * Fitur:
 * - Input teks dengan batas 250 karakter dan counter real-time
 * - Upload gambar (bisa multiple)
 * - Upload file (bisa multiple)
 * - Preview file yang dipilih sebelum kirim
 * - Validasi client-side sebelum request ke API
 *
 * @param {Function} onPostCreated Callback dipanggil setelah post berhasil dibuat
 */
export default function ComposePost({ onPostCreated }) {
  const { user }   = useAuth()
  const [content, setContent]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [selectedFiles,  setSelectedFiles]  = useState([])
  const imageRef = useRef(null)
  const fileRef  = useRef(null)
  const charLeft = 250 - content.length

  /**
   * Mengirim post baru ke API menggunakan FormData.
   * FormData dibutuhkan karena request menyertakan file upload.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return setError('Konten tidak boleh kosong')
    if (content.length > 250) return setError('Maksimum 250 karakter')
    setLoading(true)
    setError('')

    try {
      // Buat FormData dan tambahkan semua field
      const formData = new FormData()
      formData.append('content', content)

      // Append setiap gambar dengan key 'images[]' (Laravel expects array notation)
      selectedImages.forEach(img => formData.append('images[]', img))

      // Append setiap file dengan key 'files[]'
      selectedFiles.forEach(f => formData.append('files[]', f))

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Reset form setelah berhasil
      setContent('')
      setSelectedImages([])
      setSelectedFiles([])
      if (imageRef.current) imageRef.current.value = ''
      if (fileRef.current)  fileRef.current.value  = ''

      // Panggil callback untuk menambahkan post ke feed
      onPostCreated(res.data.post)

      // Informasikan jika post di-flag karena bad words
      if (res.data.is_flagged) {
        alert('⚠️ Post berhasil dibuat namun sedang ditinjau karena mengandung konten yang tidak pantas.')
      }
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        const messages = Object.values(errors).flat()
        setError(messages.join(', '))
      } else {
        setError(err.response?.data?.message || 'Gagal membuat post')
      }
    } finally {
      setLoading(false)
    }
  }

  /** Hapus gambar dari daftar yang dipilih */
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  /** Hapus file dari daftar yang dipilih */
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="compose-box mb-4">
      <div className="d-flex gap-3">
        {/* Avatar user */}
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="avatar" className="avatar" />
        ) : (
          <div className="avatar-placeholder">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}

        <div className="flex-grow-1">
          <form onSubmit={handleSubmit}>
            {/* Textarea konten */}
            <textarea
              className="form-control border-0 shadow-none"
              rows={3}
              placeholder="Apa yang sedang kamu pikirkan? Gunakan #hashtag"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={250}
              style={{ resize: 'none', fontSize: '1.1rem' }}
            />

            {/* Counter karakter */}
            <div className="d-flex justify-content-end mb-1">
              <span className={`char-counter ${charLeft < 30 ? 'danger' : ''}`}>
                {charLeft}
              </span>
            </div>

            {/* Preview gambar yang dipilih */}
            {selectedImages.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-2">
                {selectedImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(img)}
                      alt={img.name}
                      style={{ height: 80, width: 80, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        padding: '0 4px', borderRadius: '50%', lineHeight: 1.4
                      }}
                      onClick={() => removeImage(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Preview file yang dipilih */}
            {selectedFiles.length > 0 && (
              <div className="mb-2">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-file-earmark text-secondary"></i>
                    <small className="text-muted">{f.name}</small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      style={{ padding: '0 6px' }}
                      onClick={() => removeFile(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error message */}
            {error && <div className="alert alert-danger py-1 mb-2 small">{error}</div>}

            {/* Toolbar: upload dan tombol kirim */}
            <div className="d-flex align-items-center border-top pt-2">
              {/* Tombol upload gambar */}
              <label className="btn btn-sm btn-light me-2" title="Tambah gambar">
                <i className="bi bi-image text-primary fs-5"></i>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  multiple
                  className="d-none"
                  onChange={e => setSelectedImages(prev => [
                    ...prev,
                    ...Array.from(e.target.files),
                  ])}
                />
              </label>

              {/* Tombol upload file */}
              <label className="btn btn-sm btn-light me-2" title="Lampirkan file">
                <i className="bi bi-paperclip text-success fs-5"></i>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="d-none"
                  onChange={e => setSelectedFiles(prev => [
                    ...prev,
                    ...Array.from(e.target.files),
                  ])}
                />
              </label>

              <span className="text-muted small ms-auto me-3">
                Gunakan <strong>#hashtag</strong> untuk tag topik
              </span>

              {/* Tombol kirim */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !content.trim() || content.length > 250}
                style={{ borderRadius: '20px', minWidth: '80px' }}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
