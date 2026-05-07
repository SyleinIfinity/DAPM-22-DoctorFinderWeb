import { useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createInitials } from "../pages/doctor/doctorUi";
import "../pages/member/member.css";

export function MemberLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = (session?.vaiTro || "").toUpperCase();

  if (role === "BAC_SI" && session?.activePortal === "doctor") return <Navigate to="/doctor/home" replace />;
  if (role === "ADMIN" || role === "QUAN_TRI_VIEN") return <Navigate to="/admin/pending-doctors" replace />;

  const name = session?.tenDangNhap ?? "Thanh Vien";
  const accountId = session?.maTaiKhoan ?? null;

  const handleLogout = () => {
    setMenuOpen(false);
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="member-layout">
      <header className="member-topbar">
        <div className="member-topbar__inner">
          <div className="member-topbar__brand">
            <div className="member-brand-mark">FD</div>
            <div className="member-brand-text">
              <div className="member-brand-title">Finder Doctor</div>
              <div className="member-brand-subtitle">Member Hub</div>
            </div>
          </div>
          <nav className="member-topbar__nav">
            {[
              { to: "/app/home", label: "Trang chủ" },
              { to: "/app/search", label: "Tìm kiếm" },
              { to: "/app/appointments", label: "Lịch hẹn" },
              { to: "/app/follows", label: "Theo dõi" },
              { to: "/app/messages", label: "Tin nhắn" },
            ].map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "member-topbar__item member-topbar__item--active" : "member-topbar__item"} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="member-topbar__actions">
            <button className="member-avatar-btn" type="button" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Tài khoản">
              <span className="member-avatar">{createInitials(name)}</span>
            </button>
            {menuOpen ? (
              <div className="member-user-menu">
                <div className="member-user-menu__header">
                  <div className="member-user-menu__name">{name}</div>
                  <div className="member-user-menu__meta">TK #{accountId ?? "—"}</div>
                </div>
                <NavLink to="/app/account" className="member-user-menu__item" onClick={() => setMenuOpen(false)}>Hồ sơ tài khoản</NavLink>
                <button className="member-user-menu__item member-user-menu__danger" type="button" onClick={handleLogout}>Đăng xuất</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="member-layout__main">
        <div className="member-layout__page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
