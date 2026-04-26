import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BottomNav } from '../components/BottomNav'

export function DoctorLayout() {
  const { session } = useAuth()
  const role = (session?.vaiTro || '').toUpperCase()

  if (role !== 'BAC_SI') return <Navigate to="/app/home" replace />

  return (
    <>
      <div className="container page">
        <Outlet />
      </div>
      <BottomNav
        items={[
          { to: '/doctor/home', label: 'Dashboard' },
          { to: '/doctor/requests', label: 'Yêu cầu' },
          { to: '/doctor/schedule', label: 'Lịch' },
          { to: '/doctor/messages', label: 'Tin nhắn' },
          { to: '/doctor/account', label: 'Tài khoản' },
        ]}
      />
    </>
  )
}

