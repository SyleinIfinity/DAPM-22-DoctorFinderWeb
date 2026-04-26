import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BottomNav } from '../components/BottomNav'

export function AdminLayout() {
  const { session } = useAuth()
  const role = (session?.vaiTro || '').toUpperCase()
  const isAdmin = role === 'ADMIN' || role === 'QUAN_TRI_VIEN'

  if (!isAdmin) return <Navigate to="/app/home" replace />

  return (
    <>
      <div className="container page">
        <Outlet />
      </div>
      <BottomNav
        items={[
          { to: '/admin/pending-doctors', label: 'Duyệt BS' },
          { to: '/admin/accounts', label: 'Tài khoản' },
          { to: '/app/account', label: 'Tôi' },
        ]}
      />
    </>
  )
}

