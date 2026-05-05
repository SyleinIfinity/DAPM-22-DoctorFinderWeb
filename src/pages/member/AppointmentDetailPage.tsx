import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";

export function AppointmentDetailPage() {
  const navigate = useNavigate();

  // 1. Dữ liệu giả lập theo đúng ảnh Design
  const detail = {
    maPhieu: "#PDL-20260429-0085",
    trangThai: "Chờ xác nhận",
    bacSi: "BS. Nguyễn Thanh Tùng",
    chuyenKhoa: "Thần kinh học · TS Y khoa",
    thoiGian: "Thứ Ba, 29/04/2026",
    gio: "08:30 — 09:00 · 30 phút",
    diaDiem: "Tại phòng khám",
    diaChi: "BV Bạch Mai, 78 Giải Phóng, HN",
    lyDo: "Khám lần đầu",
    ghiChu: "Đau đầu liên tục, chóng mặt buổi sáng",
    benhNhan: "Trần Minh Nhân",
  };

  const statusStyle = { color: "#f59e0b", bg: "#fffbeb", border: "#fef3c7" };

  return (
    <div
      style={{
        backgroundColor: "#F4F7F8",
        minHeight: "100vh",
        paddingBottom: "100px",
      }}
    >
      <PageHeader
        title="Phiếu đặt lịch"
        right={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "13px",
              color: "#f59e0b",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid #f59e0b",
                display: "inline-block",
              }}
            ></span>{" "}
            Chờ xác nhận
          </div>
        }
      />

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
        {/* 2. Phần Thông báo trạng thái phía trên */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#e6fffa",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
              color: "#0d9488",
              fontSize: "32px",
            }}
          >
            ✔
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "800",
              margin: "0 0 10px 0",
            }}
          >
            Phiếu đã được gửi!
          </h2>
          <p style={{ color: "#666", fontSize: "14px", margin: "0 0 5px 0" }}>
            Bác sĩ sẽ xác nhận trong vòng 30 phút.
          </p>
          <p style={{ color: "#0d9488", fontWeight: "bold", fontSize: "14px" }}>
            Mã phiếu: {detail.maPhieu}
          </p>

          <div
            style={{
              display: "inline-block",
              marginTop: "15px",
              padding: "6px 20px",
              borderRadius: "20px",
              border: `1px solid ${statusStyle.color}`,
              color: statusStyle.color,
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            ● {detail.trangThai}
          </div>
        </div>

        {/* 3. Khối Chi tiết lịch hẹn (Card trắng) */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "24px",
            padding: "25px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "25px",
              fontWeight: "bold",
            }}
          >
            📅 Chi tiết lịch hẹn
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "25px" }}
          >
            {/* Item: Bác sĩ */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "12px",
                  backgroundColor: "#0d9488",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                }}
              >
                👤
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "4px",
                  }}
                >
                  Bác sĩ
                </div>
                <div style={{ fontWeight: "bold" }}>{detail.bacSi}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {detail.chuyenKhoa}
                </div>
              </div>
            </div>

            {/* Item: Thời gian */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "12px",
                  backgroundColor: "#0d9488",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                }}
              >
                📅
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "4px",
                  }}
                >
                  Thời gian
                </div>
                <div style={{ fontWeight: "bold" }}>{detail.thoiGian}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {detail.gio}
                </div>
              </div>
            </div>

            {/* Item: Địa điểm */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "12px",
                  backgroundColor: "#0d9488",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                }}
              >
                📍
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "4px",
                  }}
                >
                  Địa điểm
                </div>
                <div style={{ fontWeight: "bold" }}>{detail.diaDiem}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {detail.diaChi}
                </div>
              </div>
            </div>

            {/* Item: Lý do */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "12px",
                  backgroundColor: "#0d9488",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                }}
              >
                📋
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "4px",
                  }}
                >
                  Lý do khám
                </div>
                <div style={{ fontWeight: "bold" }}>{detail.lyDo}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {detail.ghiChu}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Action Bar (Giống hệt Design) */}
      <div
        style={{
          position: "fixed",
          bottom: "0",
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          padding: "15px 20px 30px",
          borderTop: "1px solid #eee",
          display: "flex",
          gap: "12px",
        }}
      >
        <button
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "25px",
            border: "1px solid #eee",
            backgroundColor: "#fff",
            color: "#E91E63",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Huỷ lịch
        </button>
        <button
          onClick={() => navigate("/app/messages/101")}
          style={{
            flex: 1.2,
            padding: "14px",
            borderRadius: "25px",
            border: "none",
            backgroundColor: "#e6fffa",
            color: "#0d9488",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          💬 Nhắn tin
        </button>
        <button
          onClick={() => navigate("/app/home")}
          style={{
            flex: 1.5,
            padding: "14px",
            borderRadius: "25px",
            border: "none",
            backgroundColor: "#0d9488",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          🏠 Trang chủ
        </button>
      </div>
    </div>
  );
}
