import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../api/http";
import type { LoginResponse } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, setSessionFromLogin, logout } = useAuth();
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = (session?.vaiTro || "").toUpperCase();
  const isAdmin = role === "ADMIN" || role === "QUAN_TRI_VIEN";
  if (session && isAdmin) {
    return <Navigate to="/admin/home" replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post<LoginResponse>("/api/auth/login", {
        tenDangNhap: tenDangNhap.trim(),
        matKhau,
      });
      const next = setSessionFromLogin(response.data);
      const r = (next.vaiTro || "").toUpperCase();
      if (r !== "ADMIN" && r !== "QUAN_TRI_VIEN") {
        logout();
        setError("Tài khoản này không có quyền quản trị.");
        return;
      }
      navigate("/admin/home", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)",
        fontFamily: "system-ui, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 20,
          padding: "36px 32px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
          QUẢN TRỊ
        </div>
        <h1 style={{ margin: "8px 0 4px", fontSize: 26, color: "#0f172a" }}>Đăng nhập Admin</h1>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>
          Chỉ tài khoản vai trò quản trị viên mới vào được khu vực này.
        </p>

        <form onSubmit={onSubmit}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#334155" }}>
            Tên đăng nhập
          </label>
          <input
            value={tenDangNhap}
            onChange={(e) => setTenDangNhap(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              marginBottom: 16,
              fontSize: 15,
              boxSizing: "border-box",
            }}
          />
          <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#334155" }}>
            Mật khẩu
          </label>
          <input
            type="password"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              marginBottom: 16,
              fontSize: 15,
              boxSizing: "border-box",
            }}
          />
          {error ? (
            <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: loading ? "#94a3b8" : "#0d9488",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#64748b" }}>
          <Link to="/login" style={{ color: "#0d9488", fontWeight: 600 }}>
            Đăng nhập người dùng thường
          </Link>
        </p>
      </div>
    </div>
  );
}
