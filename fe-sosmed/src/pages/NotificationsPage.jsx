import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/axios'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    markAsRead()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      // Notifications is paginated; Laravel returns pagination object
      setNotifications(res.data.data)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await api.post('/notifications/mark-read')
    } catch (err) {
      console.error('Failed to mark as read', err)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'Baru saja'
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body px-4 py-3 border-bottom">
              <h4 className="mb-0 fw-bold">Notifikasi</h4>
            </div>
            <div className="list-group list-group-flush rounded-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-bell-slash fs-1 mb-3 d-block"></i>
                  <p className="mb-0">Belum ada notifikasi.</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const data = notif.data
                  const Icon = data.type === 'like' ? 'bi-heart-fill text-danger' : 'bi-chat-fill text-primary'
                  
                  return (
                    <div key={notif.id} className={`list-group-item list-group-item-action py-3 px-4 ${notif.read_at ? '' : 'bg-light'}`}>
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div className="d-flex gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={`bi ${Icon} fs-5`}></i>
                          </div>
                          <div>
                            <p className="mb-1">
                              <strong>
                                <Link to={`/profile/${data.actor_username}`} className="text-decoration-none text-dark">
                                  {data.actor_name}
                                </Link>
                              </strong>{' '}
                              <span className="text-muted">{data.message}</span>
                            </p>
                            <small className="text-muted">
                              {timeAgo(notif.created_at)}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
