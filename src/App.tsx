import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AdminLayout } from "./layouts/AdminLayout";
import { DoctorLayout } from "./layouts/DoctorLayout";
import { MemberLayout } from "./layouts/MemberLayout";
import { AdminAccountsPage } from "./pages/admin/AdminAccountsPage";
import { AdminAccountDetailPage } from "./pages/admin/AdminAccountDetailPage";
import { AdminDoctorDetailPage } from "./pages/admin/AdminDoctorDetailPage";
import { AdminPendingDoctorsPage } from "./pages/admin/AdminPendingDoctorsPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminHomePage } from "./pages/admin/AdminHomePage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { DoctorDocumentsPage } from "./pages/doctor/DoctorDocumentsPage";
import { DoctorHomePage } from "./pages/doctor/DoctorHomePage";
import { DoctorProfileUpdatePage } from "./pages/doctor/DoctorProfileUpdatePage";
import { DoctorRequestsPage } from "./pages/doctor/DoctorRequestsPage";
import { DoctorSchedulePage } from "./pages/doctor/DoctorSchedulePage";
import { DoctorWorkspacePage } from "./pages/doctor/DoctorWorkspacePage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AccountPage } from "./pages/member/AccountPage";
import { AppointmentDetailPage } from "./pages/member/AppointmentDetailPage";
import { AppointmentsPage } from "./pages/member/AppointmentsPage";
import { ChooseKnownDoctorPage } from "./pages/member/ChooseKnownDoctorPage";
import { DoctorStatusPage } from "./pages/member/DoctorStatusPage";
import { DoctorDetailPage } from "./pages/member/DoctorDetailPage";
import { FollowsPage } from "./pages/member/FollowsPage";
import HomePage from "./pages/member/HomePage";
import { ChatPage } from "./pages/member/ChatPage";
import { MessagesPage } from "./pages/member/MessagesPage";
import { RecentDoctorsPage } from "./pages/member/RecentDoctorsPage";
import { SuggestedDoctorsPage } from "./pages/member/SuggestedDoctorsPage";
import { WorkingSlotsPage } from "./pages/member/WorkingSlotsPage";
import { CreateAppointmentPage } from "./pages/member/CreateAppointmentPage";
import { DoctorSearchPage } from "./pages/member/DoctorSearchPage";

function IndexRoute() {
  const { session } = useAuth();
  if (!session) return <LandingPage />;
  const role = (session.vaiTro || "").toUpperCase();
  if (role === "BAC_SI")
    return (
      <Navigate
        to={session.activePortal === "doctor" ? "/doctor/home" : "/app/home"}
        replace
      />
    );
  if (role === "ADMIN" || role === "QUAN_TRI_VIEN")
    return <Navigate to="/admin/home" replace />;
  return (
    <Navigate
      to={session.activePortal === "doctor" ? "/doctor/home" : "/app/home"}
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app" element={<MemberLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="search" element={<DoctorSearchPage />} />
          <Route path="doctor-status" element={<DoctorStatusPage />} />
          <Route path="doctors/recent" element={<RecentDoctorsPage />} />
          <Route path="doctors/suggested" element={<SuggestedDoctorsPage />} />
          <Route path="doctors/:maBacSi" element={<DoctorDetailPage />} />
          <Route path="doctors/:maBacSi/slots" element={<WorkingSlotsPage />} />
          <Route path="appointments/new" element={<CreateAppointmentPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route
            path="appointments/new/known"
            element={<ChooseKnownDoctorPage />}
          />
          <Route
            path="appointments/:maPhieuDatLich"
            element={<AppointmentDetailPage />}
          />
          <Route path="follows" element={<FollowsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:maCuocHoiThoai" element={<ChatPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<DoctorHomePage />} />
          <Route path="workspace" element={<DoctorWorkspacePage />} />
          <Route path="account/update" element={<DoctorProfileUpdatePage />} />
          <Route path="requests" element={<DoctorRequestsPage />} />
          <Route path="schedule" element={<DoctorSchedulePage />} />
          <Route path="documents" element={<DoctorDocumentsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:maCuocHoiThoai" element={<ChatPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<AdminHomePage />} />
          <Route path="pending-doctors" element={<AdminPendingDoctorsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="doctors/:maBacSi" element={<AdminDoctorDetailPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
          <Route
            path="accounts/:maTaiKhoan"
            element={<AdminAccountDetailPage />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
