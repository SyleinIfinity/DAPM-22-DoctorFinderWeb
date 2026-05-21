import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";
import { api } from "../../api/http";
import { getApiErrorMessage } from "../../utils/errors";
import {
  clearRecentDoctors,
  loadRecentDoctors,
} from "../../utils/recentDoctors";
import type { DoctorProfile } from "../../api/types";

export function RecentDoctorsPage() {
  const navigate = useNavigate();
  const [recentMaBacSiList, setRecentMaBacSiList] = useState<number[]>([]);

  useEffect(() => {
    const saved = loadRecentDoctors();
    setRecentMaBacSiList(saved.map(d => d.maBacSi));
  }, []);

  // Fetch full doctor profiles for all recent doctors
  const queries = useQueries({
    queries: recentMaBacSiList.map(maBacSi => ({
      queryKey: ["doctor-profile", maBacSi],
      queryFn: async () =>
        (await api.get<DoctorProfile>(`/api/doctors/${maBacSi}`)).data,
      enabled: maBacSi > 0,
    })),
  });

  const list = useMemo(() => {
    return queries
      .map(q => q.data)
      .filter((d): d is DoctorProfile => !!d);
  }, [queries]);

  const isLoading = queries.some(q => q.isLoading);
  const errors = queries.filter(q => q.isError).map(q => q.error);
  const hasError = errors.length > 0;

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?")) {
      clearRecentDoctors();
      setRecentMaBacSiList([]);
    }
  };

  return (
    <div style={{ backgroundColor: "#F0F9FB", minHeight: "100vh", paddingBottom: "40px" }}>
      <PageHeader
        title={
          <span
            style={{
              backgroundColor: "#ECFDF5",
              color: "#0F766E",
              padding: "8px 24px",
              borderRadius: "24px",
              fontSize: "18px",
              fontWeight: "bold",
              border: "2px solid #A8DEDA",
              display: "inline-block",
              boxShadow: "0 2px 8px rgba(13, 148, 136, 0.1)",
            }}
          >
            📋 Bác sĩ vừa xem
          </span>
        }
        right={
          <Link
            className="btn btn-ghost"
            to="/app/home"
            style={{ color: "#666", fontWeight: "bold" }}
          >
            Trang chủ
          </Link>
        }
      />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 20px" }}>
        {hasError && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "2px solid #fecaca",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "14px",
              marginBottom: "24px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {getApiErrorMessage(errors[0])}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#24D5DB", fontWeight: "bold", fontSize: "16px" }}>
            ⏳ Đang tải bác sĩ vừa xem...
          </div>
        )}

        {!isLoading && list.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af", fontSize: "16px" }}>
            Bạn chưa xem hồ sơ bác sĩ nào gần đây.
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "2px solid #D1E5F0",
          }}
        >
          <span style={{ color: "#475569", fontSize: "16px", fontWeight: "600" }}>
            📋 {list.length} bác sĩ đã xem
          </span>
          {list.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                background: "#fff",
                border: "2px solid #f0f0f0",
                padding: "10px 18px",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#6b7280",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ffe5e5";
                e.currentTarget.style.borderColor = "#fecaca";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.borderColor = "#f0f0f0";
              }}
            >
              🗑 Xóa lịch sử
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {list.map((d) => {
            const initials = (d.hoTenDayDu || "BS").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "BS";
            return (
              <div
                key={d.maBacSi}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "22px",
                  borderRadius: "16px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(36, 213, 219, 0.08)",
                  border: "2px solid #E0F2F1",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(36, 213, 219, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#24D5DB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(36, 213, 219, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#E0F2F1";
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}
                >
                  {/* Avatar Section */}
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "14px",
                      backgroundColor: "#E0F7F6",
                      display: "grid",
                      placeItems: "center",
                      color: "#0D9488",
                      fontWeight: "bold",
                      fontSize: "22px",
                      flexShrink: 0,
                      overflow: "hidden",
                      border: "3px solid #A8DEDA",
                      boxShadow: "0 4px 12px rgba(13, 148, 136, 0.12)",
                    }}
                  >
                    {d.anhDaiDien ? (
                      <img
                        src={d.anhDaiDien}
                        alt={d.hoTenDayDu}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Info Section */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: "18px",
                        color: "#0F766E",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {d.hoTenDayDu}
                    </div>
                    <div style={{ fontSize: "14px", color: "#4B5563", fontWeight: "500" }}>
                      <span style={{ color: "#24D5DB", fontWeight: "700" }}>
                        {d.chuyenKhoa}
                      </span>
                      <span style={{ color: "#9CA3AF" }}> • {d.tenCoSoYTe}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280", display: "flex", alignItems: "center", gap: "6px" }}>
                      📍 <span>{d.diaChiLamViec || "Chưa cập nhật"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button Section */}
                <button
                  onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}
                  style={{
                    backgroundColor: "#2563EB",
                    color: "#fff",
                    border: "none",
                    padding: "10px 32px",
                    borderRadius: "24px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1D4ED8";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563EB";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Xem lại
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
