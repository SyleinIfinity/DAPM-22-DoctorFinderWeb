import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { DoctorSidebar } from '../components/DoctorSidebar'
import '../pages/doctor/doctor.css'

export function DoctorLayout() {
  const { session } = useAuth()
  const role = (session?.vaiTro || '').toUpperCase()

  if (role !== 'BAC_SI') return <Navigate to="/app/home" replace />

  return (
    <div className="doctor-layout doctor-layout--with-sidebar">
      <DoctorSidebar
        items={[
          { to: '/doctor/home',      label: 'Tổng quan' },
          { to: '/doctor/requests',  label: 'Lịch hẹn' },
          { to: '/doctor/workspace', label: 'Điều phối' },
          { to: '/doctor/messages',  label: 'Tin nhắn' },
          { to: '/doctor/account',   label: 'Tài khoản' },
        ]}
      />
      <main className="doctor-layout__main">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  )
}