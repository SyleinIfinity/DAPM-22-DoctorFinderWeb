import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";

export function WorkingSlotsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const maBacSi = Number(params.maBacSi);

  const [date, setDate] = useState<string>("2026-04-29");
  const [selected, setSelected] = useState<any>(null);

  const doctor = {
    hoTen: "BS. Nguyễn Thanh Tùng",
    chuyenKhoa: "Thần kinh học · BV Bạch Mai",
    rating: "4.9 ★",
  };

  const slotsQuery = useQuery({
    queryKey: ["working-slots", maBacSi, date],
    queryFn: async () =>
      [
        { maChiTiet: 1, gioBatDau: "08:00", trangThai: "TRONG", buoi: "SANG" },
        { maChiTiet: 2, gioBatDau: "08:30", trangThai: "TRONG", buoi: "SANG" },
        { maChiTiet: 3, gioBatDau: "09:00", trangThai: "DA_DAT", buoi: "SANG" },
        { maChiTiet: 4, gioBatDau: "14:00", trangThai: "TRONG", buoi: "CHIEU" },
        { maChiTiet: 5, gioBatDau: "14:30", trangThai: "TRONG", buoi: "CHIEU" },
      ] as any[],
  });

  return (
    <div
      style={{
        backgroundColor: "#F4F7F8",
        minHeight: "100vh",
        paddingBottom: "100px",
      }}
    >
      <PageHeader
        title="Đặt lịch khám"
        right={
          <span style={{ fontSize: "12px", color: "#0d9488" }}>Bước 1 / 3</span>
        }
      />

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "15px" }}>
        {/* INFO CARD */}
        <div
          className="card row-between"
          style={{
            padding: "15px",
            borderRadius: "15px",
            marginBottom: "15px",
            backgroundColor: "#fff",
          }}
        >
          <div className="row" style={{ gap: "12px" }}>
            <div
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                backgroundColor: "#eee",
                display: "grid",
                placeItems: "center",
                fontSize: "20px",
              }}
            >
              👤
            </div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                {doctor.hoTen}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {doctor.chuyenKhoa}
              </div>
            </div>
          </div>
          <div
            style={{ fontSize: "13px", color: "#0d9488", fontWeight: "bold" }}
          >
            {doctor.rating}
          </div>
        </div>

        {/* DATE STRIP */}
        <div
          className="card"
          style={{
            padding: "0",
            borderRadius: "15px",
            overflow: "hidden",
            marginBottom: "15px",
            backgroundColor: "#fff",
          }}
        >
          <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px",
                color: "#0d9488",
                borderBottom: "2px solid #0d9488",
                fontWeight: "bold",
              }}
            >
              LỊCH TUẦN
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px",
                color: "#666",
              }}
            >
              NGÀY CỤ THỂ
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "15px",
              overflowX: "auto",
            }}
          >
            {[29, 30, 1, 2, 3, 4, 5].map((d) => {
              const fullDate = `2026-04-${d < 10 ? "0" + d : d}`;
              const isActive = date.endsWith(d.toString());
              return (
                <div
                  key={d}
                  onClick={() => setDate(fullDate)}
                  style={{
                    minWidth: "55px",
                    padding: "10px 0",
                    borderRadius: "12px",
                    border: isActive ? "1.5px solid #0d9488" : "1px solid #eee",
                    textAlign: "center",
                    backgroundColor: isActive ? "#f0fdfa" : "#fff",
                    cursor: "pointer",
                    transition: "0.2s",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: isActive ? "#0d9488" : "#999",
                    }}
                  >
                    T{d === 29 ? "3" : "?"}
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: isActive ? "#0d9488" : "#333",
                    }}
                  >
                    {d}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIME GRID */}
        <div
          className="card"
          style={{
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "15px",
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "12px",
            }}
          >
            ☀️ Buổi sáng
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {slotsQuery.data
              ?.filter((s) => s.buoi === "SANG")
              .map((s) => (
                <button
                  key={s.maChiTiet}
                  onClick={() => setSelected(s)}
                  disabled={s.trangThai !== "TRONG"}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      selected?.maChiTiet === s.maChiTiet
                        ? "#0d9488"
                        : s.trangThai === "TRONG"
                          ? "#e2e8f0"
                          : "#f1f5f9",
                    color:
                      selected?.maChiTiet === s.maChiTiet
                        ? "#fff"
                        : s.trangThai === "TRONG"
                          ? "#333"
                          : "#cbd5e1",
                    fontWeight: "600",
                    cursor: s.trangThai === "TRONG" ? "pointer" : "not-allowed",
                    transition: "0.2s",
                  }}
                >
                  {s.gioBatDau}
                </button>
              ))}
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "12px",
            }}
          >
            🌙 Buổi chiều
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {slotsQuery.data
              ?.filter((s) => s.buoi === "CHIEU")
              .map((s) => (
                <button
                  key={s.maChiTiet}
                  onClick={() => setSelected(s)}
                  disabled={s.trangThai !== "TRONG"}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      selected?.maChiTiet === s.maChiTiet
                        ? "#0d9488"
                        : "#e2e8f0",
                    color:
                      selected?.maChiTiet === s.maChiTiet ? "#fff" : "#333",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {s.gioBatDau}
                </button>
              ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#e6fffa",
            padding: "12px 15px",
            borderRadius: "12px",
            color: "#0d9488",
            fontSize: "13px",
            border: "1px solid #b2f2e9",
          }}
        >
          📅 Đã chọn: <b>Thứ Ba {date.split("-").reverse().join("/")}</b> -{" "}
          <b>{selected ? selected.gioBatDau : "--:--"}</b>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "15px 20px 30px",
          backgroundColor: "#fff",
          borderTop: "1px solid #eee",
          display: "flex",
          gap: "15px",
          zIndex: 100,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "25px",
            border: "1px solid #eee",
            background: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            color: "#666",
          }}
        >
          Hủy
        </button>
        <button
          disabled={!selected}
          onClick={() => {
            console.log("Navigating to step 2...");
            // Đảm bảo URL này khớp với Route trong App.tsx
            navigate(`/app/appointments/new`, {
              state: {
                doctor,
                selectedSlot: selected,
                date,
              },
            });
          }}
          style={{
            flex: 2,
            padding: "14px",
            borderRadius: "25px",
            border: "none",
            backgroundColor: selected ? "#0d9488" : "#ccc",
            color: "#fff",
            fontWeight: "bold",
            cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected ? "0 4px 12px rgba(13, 148, 136, 0.2)" : "none",
          }}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
