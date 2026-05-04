import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import {
  clearRecentDoctors,
  loadRecentDoctors,
} from "../../utils/recentDoctors";

export function RecentDoctorsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState(() => {
    const saved = loadRecentDoctors();
    return saved.length === 0
      ? [
          {
            maBacSi: 201,
            hoTenDayDu: "BS. Trương Hoàng Long",
            chuyenKhoa: "Răng Hàm Mặt",
            tenCoSoYTe: "BV Răng Hàm Mặt Trung Ương",
            diaChiLamViec: "Quận 1, TP.HCM",
          },
          {
            maBacSi: 202,
            hoTenDayDu: "BS. Ngô Bảo Châu",
            chuyenKhoa: "Ngoại thần kinh",
            tenCoSoYTe: "Bệnh viện Chợ Rẫy",
            diaChiLamViec: "Quận 5, TP.HCM",
          },
        ]
      : saved;
  });

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?")) {
      clearRecentDoctors();
      setList([]);
    }
  };

  return (
    <div style={{ backgroundColor: "#F8FAFB", minHeight: "100vh" }}>
      <PageHeader
        title="Bác sĩ vừa xem"
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

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <span style={{ color: "#888", fontSize: "14px" }}>
            {list.length} bác sĩ đã xem
          </span>
          <button
            onClick={handleClear}
            style={{
              background: "#fff",
              border: "1px solid #eee",
              padding: "8px 15px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            🗑 Xóa lịch sử
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {list.map((d) => (
            <div
              key={d.maBacSi}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderRadius: "24px",
                backgroundColor: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                border: "1px solid #f1f3f5",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "20px" }}
              >
                {/* Avatar tròn bên trái */}
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "#E6FFFA",
                    display: "grid",
                    placeItems: "center",
                    color: "#0D9488",
                    fontWeight: "bold",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {d.hoTenDayDu.split(" ").pop()?.charAt(0)}
                </div>

                {/* Thông tin ở giữa */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "17px",
                      color: "#24D5DB",
                    }}
                  >
                    {d.hoTenDayDu}
                  </div>
                  <div style={{ fontSize: "14px", color: "#444" }}>
                    <strong>{d.chuyenKhoa}</strong> • {d.tenCoSoYTe}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888" }}>
                    📍 {d.diaChiLamViec || "—"}
                  </div>
                </div>
              </div>

              {/* Nút Xem lại bên phải */}
              <button
                onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}
                style={{
                  backgroundColor: "#24D5DB",
                  color: "#fff",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Xem lại
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
