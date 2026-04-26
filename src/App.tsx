import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { AdminLayout } from './layouts/AdminLayout'
import { DoctorLayout } from './layouts/DoctorLayout'
import { MemberLayout } from './layouts/MemberLayout'
import { AdminAccountsPage } from './pages/admin/AdminAccountsPage'
import { AdminDoctorDetailPage } from './pages/admin/AdminDoctorDetailPage'
import { AdminPendingDoctorsPage } from './pages/admin/AdminPendingDoctorsPage'
import { DoctorDocumentsPage } from './pages/doctor/DoctorDocumentsPage'
import { DoctorHomePage } from './pages/doctor/DoctorHomePage'
import { DoctorRequestsPage } from './pages/doctor/DoctorRequestsPage'
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AccountPage } from './pages/member/AccountPage'
import { AppointmentDetailPage } from './pages/member/AppointmentDetailPage'
import { AppointmentsPage } from './pages/member/AppointmentsPage'
import { ChooseKnownDoctorPage } from './pages/member/ChooseKnownDoctorPage'
import { DoctorDetailPage } from './pages/member/DoctorDetailPage'
import { FollowsPage } from './pages/member/FollowsPage'
import { HomePage } from './pages/member/HomePage'
import { ChatPage } from './pages/member/ChatPage'
import { MessagesPage } from './pages/member/MessagesPage'
import { WorkingSlotsPage } from './pages/member/WorkingSlotsPage'

function IndexRoute() {
  const { session } = useAuth()
  if (!session) return <LandingPage />

  const role = (session.vaiTro || '').toUpperCase()
  if (role === 'BAC_SI') return <Navigate to="/doctor/home" replace />
  if (role === 'ADMIN' || role === 'QUAN_TRI_VIEN') return <Navigate to="/admin/pending-doctors" replace />
  return <Navigate to="/app/home" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <MemberLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="doctors/:maBacSi" element={<DoctorDetailPage />} />
          <Route path="doctors/:maBacSi/slots" element={<WorkingSlotsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/new/known" element={<ChooseKnownDoctorPage />} />
          <Route path="appointments/:maPhieuDatLich" element={<AppointmentDetailPage />} />
          <Route path="follows" element={<FollowsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:maCuocHoiThoai" element={<ChatPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route
          path="/doctor"
          element={
            <RequireAuth>
              <DoctorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<DoctorHomePage />} />
          <Route path="requests" element={<DoctorRequestsPage />} />
          <Route path="schedule" element={<DoctorSchedulePage />} />
          <Route path="documents" element={<DoctorDocumentsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:maCuocHoiThoai" element={<ChatPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="pending-doctors" replace />} />
          <Route path="pending-doctors" element={<AdminPendingDoctorsPage />} />
          <Route path="doctors/:maBacSi" element={<AdminDoctorDetailPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
