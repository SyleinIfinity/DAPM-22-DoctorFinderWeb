import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BottomNav } from '../components/BottomNav'

export function MemberLayout() {
  const { session } = useAuth()
  const role = (session?.vaiTro || '').toUpperCase()

  if (role === 'BAC_SI') return <Navigate to="/doctor/home" replace />
  if (role === 'ADMIN' || role === 'QUAN_TRI_VIEN') return <Navigate to="/admin/pending-doctors" replace />

  return (
    <>
      <div className="container page">
        <Outlet />
      </div>
      <BottomNav
        items={[
          { to: '/app/home', label: 'Trang chủ' },
          { to: '/app/appointments', label: 'Đặt lịch' },
          { to: '/app/follows', label: 'Theo dõi' },
          { to: '/app/messages', label: 'Nhắn tin' },
          { to: '/app/account', label: 'Tài khoản' },
        ]}
      />
    </>
  )
}

