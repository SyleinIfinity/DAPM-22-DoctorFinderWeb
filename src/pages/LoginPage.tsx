import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/http";
import type { LoginResponse } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/errors";

export function LoginPage() {
  const navigate = useNavigate();
  const { session, setSessionFromLogin } = useAuth();

  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    if (session.activePortal === "doctor")
      return <Navigate to="/doctor/home" replace />;
    const role = (session.vaiTro || "").toUpperCase();
    if (role === "ADMIN" || role === "QUAN_TRI_VIEN")
      return <Navigate to="/admin/pending-doctors" replace />;
    return <Navigate to="/app/home" replace />;
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

      const nextSession = setSessionFromLogin(response.data);
      const role = (nextSession.vaiTro || "").toUpperCase();

      if (role === "ADMIN" || role === "QUAN_TRI_VIEN") {
        navigate("/admin/pending-doctors", { replace: true });
        return;
      }

      navigate(
        nextSession.activePortal === "doctor" ? "/doctor/home" : "/app/home",
        { replace: true },
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    wrapper: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f5f7fa",
      fontFamily: "Arial, sans-serif",
    },
    card: {
      backgroundColor: "#ffffff",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      width: "100%",
      maxWidth: "400px",
      borderTop: "8px solid #24D5DB",
    },
    title: {
      color: "#24D5DB",
      textAlign: "center" as const,
      fontSize: "28px",
      fontWeight: "bold",
      marginBottom: "10px",
    },
    subtitle: {
      textAlign: "center" as const,
      color: "#666",
      marginBottom: "30px",
      fontSize: "14px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      fontSize: "14px",
      color: "#333",
    },
    input: {
      width: "100%",
      padding: "12px 15px",
      marginBottom: "20px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box" as const,
    },
    button: {
      width: "100%",
      padding: "14px",
      backgroundColor: loading ? "#ccc" : "#24D5DB",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: loading ? "not-allowed" : "pointer",
      transition: "0.3s",
    },
    error: {
      color: "#e53e3e",
      fontSize: "13px",
      textAlign: "center" as const,
      marginTop: "-10px",
      marginBottom: "15px",
      fontWeight: "500",
    },
    footer: {
      marginTop: "20px",
      textAlign: "center" as const,
      fontSize: "14px",
      color: "#666",
    },
    link: {
      color: "#24D5DB",
      textDecoration: "none",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.title}>ĐĂNG NHẬP</div>
        <div style={styles.subtitle}>
          Đăng nhập bằng backend thật của DoctorFinder
        </div>

        <form onSubmit={onSubmit}>
          <div>
            <label style={styles.label}>Tên đăng nhập (Email/SĐT)</label>
            <input
              style={styles.input}
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              placeholder="Nhập tên của bạn..."
              required
            />
          </div>

          <div>
            <label style={styles.label}>Mật khẩu</label>
            <input
              style={styles.input}
              type="password"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Đang xác thực…" : "ĐĂNG NHẬP"}
          </button>

          <div style={styles.footer}>
            Chưa có tài khoản?{" "}
            <Link to="/register" style={styles.link}>
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
