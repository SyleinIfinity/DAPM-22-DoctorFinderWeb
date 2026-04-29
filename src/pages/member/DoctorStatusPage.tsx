import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/http";
import type { AccountDoctorInfo } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import {
  DoctorAvatar,
  DoctorEmptyState,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  getProfileStatusMeta,
} from "../doctor/doctorUi";

// Định nghĩa kiểu cho tài liệu tải lên
type DocUpload = { id: number; title: string; file: File | null };

function getActivityStatusMeta(status: string | null | undefined) {
  switch (status) {
    case "HOAT_DONG": return { label: "Đang hoạt động", tone: "success" as const };
    case "BI_KHOA": return { label: "Tài khoản bị khóa", tone: "danger" as const };
    case "CHO_DUYET": return { label: "Chờ kích hoạt", tone: "warning" as const };
    default: return { label: status ?? "Chưa xác định", tone: "neutral" as const };
  }
}

export function DoctorStatusPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const maTaiKhoan = session?.maTaiKhoan ?? null;

  // --- TRẠNG THÁI ĐĂNG KÝ ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [docs, setDocs] = useState<DocUpload[]>([{ id: Date.now(), title: "", file: null }]);

  const query = useQuery({
    queryKey: ["doctor-status", maTaiKhoan],
    queryFn: async () => {
      if (!maTaiKhoan) throw new Error("Thiếu phiên đăng nhập");
      const data = await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`);
      return data;
    },
    enabled: !!maTaiKhoan,
  });

  const rawData = query.data?.data ?? null;
  const activityStatus = rawData ? getActivityStatusMeta(rawData.trangThaiHoatDong) : null;
  const profileStatus = rawData?.trangThaiHoSo ? getProfileStatusMeta(rawData.trangThaiHoSo) : null;

  // Xử lý vùng minh chứng
  const addDocRow = () => setDocs([...docs, { id: Date.now(), title: "", file: null }]);
  const removeDocRow = (id: number) => { if (docs.length > 1) setDocs(docs.filter(d => d.id !== id)); };

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Account"
        title="Trạng thái hồ sơ"
        description="Thông tin tài khoản và hồ sơ bác sĩ liên kết với phiên đăng nhập hiện tại."
        actions={
          <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/app/account" style={{ color: '#000' }}>
            Chỉnh sửa hồ sơ
          </Link>
        }
      />

      {query.isLoading ? <DoctorNotice tone="info" title="Đang tải thông tin" description="Hệ thống đang lấy dữ liệu..." /> : null}

      {rawData ? (
        <>
          {/* --- HÀNG 1: HERO (GIỮ NGUYÊN) --- */}
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Thông tin tài khoản</div>
              <h2 className="doctor-hero__title">{rawData.hoLot} {rawData.ten}</h2>
              <p className="doctor-hero__subtitle">{rawData.email}</p>
              <div className="doctor-button-row">
                <Link className="doctor-button doctor-button--primary doctor-button-link" to={`/app/doctors/${rawData.maBacSi}`} style={{ color: '#000' }}>
                  Xem hồ sơ công khai
                </Link>
                {!rawData.coTaiKhoanBacSi && (
                  <button className="doctor-button doctor-button--secondary" style={{ color: '#000', cursor: 'pointer' }} onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? "Hủy đăng ký" : "Mở tài khoản bác sĩ"}
                  </button>
                )}
              </div>
            </div>

            <div className="doctor-hero__aside">
              <div className="doctor-profile-strip">
                <DoctorAvatar name={`${rawData.hoLot} ${rawData.ten}`} />
                <div>
                  <h3 className="doctor-profile-strip__name">{rawData.hoLot} {rawData.ten}</h3>
                  <p className="doctor-profile-strip__meta">{rawData.chuyenKhoa}<br />{rawData.tenCoSoYTe}</p>
                </div>
              </div>
              {activityStatus && <DoctorStatusBadge label={activityStatus.label} tone={activityStatus.tone} />}
              <div className="doctor-keyfacts">
                <div className="doctor-keyfact"><span className="doctor-keyfact__label">Mã hồ sơ bác sĩ</span><span className="doctor-keyfact__value">#{rawData.maBacSi}</span></div>
                <div className="doctor-keyfact"><span className="doctor-keyfact__label">Mã CCHN</span><span className="doctor-keyfact__value">{rawData.maChungChiHanhNghe || 'Chưa có'}</span></div>
              </div>
            </div>
          </section>

          {/* --- HÀNG 2: THẺ CHỈ SỐ (STATS - PHỤC HỒI ĐẦY ĐỦ) --- */}
          <section className="doctor-metrics-grid">
            <DoctorStatCard label="Tài khoản" value={activityStatus?.label ?? "—"} hint="Trạng thái truy cập hệ thống." />
            <DoctorStatCard label="Hồ sơ bác sĩ" value={profileStatus?.label ?? "—"} hint={profileStatus?.description ?? "Kiểm tra hồ sơ định kỳ."} />
            <DoctorStatCard label="Chuyên khoa" value={rawData.chuyenKhoa ?? "Chưa cập nhật"} hint="Hiển thị với bệnh nhân." />
            <DoctorStatCard label="Cơ sở y tế" value={rawData.tenCoSoYTe ?? "Chưa cập nhật"} hint="Bệnh viện đang công tác." />
          </section>

          {/* --- HÀNG 3: FORM ĐĂNG KÝ GỘP (HIỂN THỊ KHI NHẤN NÚT) --- */}
          {isRegistering ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '30px' }}>
              <DoctorPanel title="Thông tin chuyên môn (Theo thiết kế ERD)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">CHUYÊN KHOA</span>
                      <input type="text" placeholder="Vd: Nội khoa..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }} />
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">TRÌNH ĐỘ CHUYÊN MÔN</span>
                      <input type="text" placeholder="Vd: Thạc sĩ, CK1..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }} />
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">MÃ CCHN (UNIQUE)</span>
                      <input type="text" placeholder="Nhập số CCHN" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }} />
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">LOẠI HÌNH BÁC SĨ</span>
                      <input type="text" placeholder="Vd: Bác sĩ tư vấn" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }} />
                    </div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">TÊN CƠ SỞ Y TẾ & ĐỊA CHỈ</span>
                    <input type="text" placeholder="Tên bệnh viện" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000', marginBottom: '10px' }} />
                    <input type="text" placeholder="Địa chỉ cơ sở" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }} />
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">MÔ TẢ BẢN THÂN</span>
                    <textarea placeholder="Giới thiệu kinh nghiệm..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000', minHeight: '80px' }} />
                  </div>
                </div>
              </DoctorPanel>

              <DoctorPanel 
                title="Vùng tải lên minh chứng" 
                aside={<button onClick={addDocRow} style={{ color: '#24D5DB', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ Thêm tài liệu</button>}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {docs.map((d) => (
                    <div key={d.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#F9FAFB', padding: '10px', borderRadius: '12px' }}>
                      <input type="text" placeholder="Tiêu đề minh chứng" style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                      <input type="file" style={{ flex: 1 }} />
                      <button onClick={() => removeDocRow(d.id)} style={{ color: '#FF4D4F', border: 'none', background: 'none', fontWeight: 'bold' }}>Xóa</button>
                    </div>
                  ))}
                </div>
                <button 
                  className="doctor-button doctor-button--primary" 
                  style={{ width: '100%', marginTop: '20px', color: '#000', fontWeight: 'bold' }}
                  onClick={() => { alert("Gửi duyệt thành công!"); setIsRegistering(false); }}
                >
                  GỬI HỒ SƠ DUYỆT
                </button>
              </DoctorPanel>
            </div>
          ) : (
            /* --- HÀNG CUỐI: PANEL CHI TIẾT HOẶC EMPTY STATE --- */
            rawData.coTaiKhoanBacSi ? (
              <DoctorPanel title="Dữ liệu hồ sơ hiện tại">
                <div className="doctor-meta-list">
                  <div className="doctor-meta-item"><span className="doctor-meta-item__label">Họ tên bác sĩ</span><div className="doctor-meta-item__value">{rawData.hoLot} {rawData.ten}</div></div>
                  <div className="doctor-meta-item"><span className="doctor-meta-item__label">Mã chứng chỉ</span><div className="doctor-meta-item__value">{rawData.maChungChiHanhNghe}</div></div>
                  <div className="doctor-meta-item"><span className="doctor-meta-item__label">Nơi công tác</span><div className="doctor-meta-item__value">{rawData.tenCoSoYTe}</div></div>
                </div>
              </DoctorPanel>
            ) : (
              <DoctorPanel title="Hồ sơ bác sĩ">
                <DoctorEmptyState 
                  title="Bạn chưa có hồ sơ bác sĩ" 
                  description="Bắt đầu đăng ký để tham gia hệ thống khám chữa bệnh."
                  action={<button className="doctor-button doctor-button--primary" style={{ color: '#000' }} onClick={() => setIsRegistering(true)}>Bắt đầu đăng ký ngay</button>} 
                />
              </DoctorPanel>
            )
          )}
        </>
      ) : null}
    </div>
  );
}