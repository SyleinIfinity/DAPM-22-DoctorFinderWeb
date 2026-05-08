import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DoctorSidebar } from "../components/DoctorSidebar";
import "../pages/doctor/doctor.css";

// Reuse doctor page styles for admin for a cleaner, consistent UI
export function AdminLayout() {
  const { session } = useAuth();
  const role = (session?.vaiTro || "").toUpperCase();
  const isAdmin = role === "ADMIN" || role === "QUAN_TRI_VIEN";

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/app/home" replace />;
  }

  return (
    <div className="doctor-layout doctor-layout--with-sidebar">
      <DoctorSidebar
        brand="Admin"
        showLogout
        items={[
          { to: "/admin/home", label: "Trang chủ" },
          { to: "/admin/pending-doctors", label: "Duyệt BS" },
          { to: "/admin/accounts", label: "Tài khoản" },
          { to: "/admin/reports", label: "Thống kê" },
        ]}
      />
      <main className="doctor-layout__main">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
