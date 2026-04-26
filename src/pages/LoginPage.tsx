import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/http'
import type { LoginResponse } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/PageHeader'
import { getApiErrorMessage } from '../utils/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const { session, setSessionFromLogin } = useAuth()

  const [tenDangNhap, setTenDangNhap] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) {
    const role = (session.vaiTro || '').toUpperCase()
    if (role === 'BAC_SI') return <Navigate to="/doctor/home" replace />
    if (role === 'ADMIN' || role === 'QUAN_TRI_VIEN') return <Navigate to="/admin/pending-doctors" replace />
    return <Navigate to="/app/home" replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/api/auth/login', {
        tenDangNhap: tenDangNhap.trim(),
        matKhau,
      })
      setSessionFromLogin(res.data)

      const role = (res.data.vaiTro || '').toUpperCase()
      if (role === 'BAC_SI') navigate('/doctor/home', { replace: true })
      else if (role === 'ADMIN' || role === 'QUAN_TRI_VIEN') navigate('/admin/pending-doctors', { replace: true })
      else navigate('/app/home', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <PageHeader title="Đăng nhập" />
      <form className="card stack" onSubmit={onSubmit}>
        <div className="stack">
          <div className="label">Tên đăng nhập (Email/SĐT)</div>
          <input
            className="input"
            value={tenDangNhap}
            onChange={(e) => setTenDangNhap(e.target.value)}
            placeholder="VD: khanh@gmail.com"
            required
          />
        </div>
        <div className="stack">
          <div className="label">Mật khẩu</div>
          <input
            className="input"
            type="password"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>

        <div className="muted">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </div>
      </form>
    </div>
  )
}

