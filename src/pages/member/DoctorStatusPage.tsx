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

function getActivityStatusMeta(status: string | null | undefined) {
  switch (status) {
    case "HOAT_DONG":
      return { label: "Đang hoạt động", tone: "success" as const };
    case "BI_KHOA":
      return { label: "Tài khoản bị khóa", tone: "danger" as const };
    case "CHO_DUYET":
      return { label: "Chờ kích hoạt", tone: "warning" as const };
    default:
      return { label: status ?? "Chưa xác định", tone: "neutral" as const };
  }
}

export function DoctorStatusPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const maTaiKhoan = session?.maTaiKhoan ?? null;

  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState(1);

  const query = useQuery({
    queryKey: ["doctor-status", maTaiKhoan],
    queryFn: async () => {
      if (!maTaiKhoan) throw new Error("Thiếu phiên đăng nhập");
      const data = await api.get<AccountDoctorInfo>(
        `/api/auth/account/${maTaiKhoan}/doctor`,
      );
      return data;
    },
    enabled: !!maTaiKhoan,
  });

  const rawData = query.data?.data ?? null;
  const activityStatus = rawData
    ? getActivityStatusMeta(rawData.trangThaiHoatDong)
    : null;
  const profileStatus = rawData?.trangThaiHoSo
    ? getProfileStatusMeta(rawData.trangThaiHoSo)
    : null;

  if (isRegistering) {
    return (
      <div className="doctor-page" style={{ backgroundColor: '#F8FAFB', minHeight: '100vh', paddingBottom: '40px' }}>
        <DoctorPageHeading
          eyebrow="Nâng cấp tài khoản"
          title="Đăng ký chuyên môn Bác sĩ"
          description="Vui lòng cung cấp đầy đủ thông tin chuyên môn theo chứng chỉ hành nghề để được xét duyệt."
        />
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px' }}>
          <DoctorPanel title={step === 1 ? "Bước 1: Thông tin nghề nghiệp (Theo ERD)" : "Bước 2: Xác thực hồ sơ"}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {step === 1 ? (
                <>
                  {/* HÀNG 1: CHUYÊN KHOA & TRÌNH ĐỘ */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">CHUYÊN KHOA</span>
                      <input type="text" placeholder="Vd: Nội khoa, Thần kinh..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#000' }} />
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">TRÌNH ĐỘ CHUYÊN MÔN</span>
                      <input type="text" placeholder="Vd: Thạc sĩ, CK1, CK2..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#000' }} />
                    </div>
                  </div>

                  {/* HÀNG 2: MÃ CCHN & LOẠI HÌNH */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">MÃ CCHN (UNIQUE)</span>
                      <input type="text" placeholder="Nhập số chứng chỉ hành nghề" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#000' }} />
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">LOẠI HÌNH BÁC SĨ</span>
                      <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#000', backgroundColor: '#fff' }}>
                        <option value="">-- Chọn loại hình --</option>
                        <option value="TU_VAN">Bác sĩ tư vấn</option>
                        <option value="KHAM_BENH">Bác sĩ khám bệnh</option>
                      </select>
                    </div>
                  </div>

                  {/* HÀNG 3: CƠ SỞ Y TẾ & ĐỊA CHỈ */}
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">TÊN CƠ SỞ Y TẾ</span>
                    <input type="text" placeholder="Tên bệnh viện hoặc phòng khám đang công tác" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#000' }} />
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">ĐỊA CHỈ LÀM VIỆC (TEXT)</span>
                    <input type="text" placeholder="Địa chỉ cụ thể của cơ sở y tế" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#000' }} />
                  </div>

                  {/* HÀNG 4: MÔ TẢ BẢN THÂN */}
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">MÔ TẢ BẢN THÂN (TEXT)</span>
                    <textarea placeholder="Giới thiệu quá trình công tác, thế mạnh chuyên môn..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#000', minHeight: '100px', resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button className="doctor-button doctor-button--primary" style={{ flex: 1, color: '#000', fontWeight: 'bold' }} onClick={() => setStep(2)}>Tiếp theo</button>
                    <button className="doctor-button doctor-button--ghost" style={{ color: '#000' }} onClick={() => setIsRegistering(false)}>Hủy bỏ</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ border: '2px dashed #D1D5DB', padding: '40px', textAlign: 'center', borderRadius: '16px', backgroundColor: '#F9FAFB' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📄</div>
                    <p style={{ color: '#374151', fontWeight: 'bold' }}>Tải lên hồ sơ minh chứng</p>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '15px' }}>Vui lòng chụp rõ mặt trước và mặt sau của Chứng chỉ hành nghề</p>
                    <input type="file" style={{ margin: '0 auto' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button className="doctor-button doctor-button--primary" style={{ flex: 1, color: '#000', fontWeight: 'bold' }} onClick={() => {
                      alert("Hồ sơ của bạn đã được gửi! Quản trị viên sẽ phê duyệt dựa trên mã CCHN bạn đã cung cấp.");
                      setIsRegistering(false);
                      query.refetch();
                    }}>Gửi hồ sơ duyệt</button>
                    <button className="doctor-button doctor-button--ghost" style={{ color: '#000' }} onClick={() => setStep(1)}>Quay lại</button>
                  </div>
                </>
              )}
            </div>
          </DoctorPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Account"
        title="Trạng thái hồ sơ"
        description="Thông tin tài khoản và hồ sơ bác sĩ liên kết với phiên đăng nhập hiện tại."
        actions={
          <Link
            className="doctor-button doctor-button--secondary doctor-button-link"
            to="/app/account"
            style={{ color: '#000' }}
          >
            Chỉnh sửa hồ sơ
          </Link>
        }
      />

      {query.isLoading ? (
        <DoctorNotice tone="info" title="Đang tải thông tin" description="Hệ thống đang lấy dữ liệu hồ sơ từ backend..." />
      ) : null}

      {rawData ? (
        <>
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Thông tin tài khoản</div>
              <h2 className="doctor-hero__title">{rawData.hoLot} {rawData.ten}</h2>
              <p className="doctor-hero__subtitle">{rawData.email}</p>

              <div className="doctor-button-row">
                <Link
                  className="doctor-button doctor-button--primary doctor-button-link"
                  to={`/app/doctors/${rawData.maBacSi}`}
                  style={{ color: '#000' }}
                >
                  Xem hồ sơ công khai
                </Link>
                
                {rawData.coTaiKhoanBacSi ? (
                  <Link
                    className="doctor-button doctor-button--secondary doctor-button-link"
                    to="/doctor/documents"
                    style={{ color: '#000' }}
                  >
                    Quản lý minh chứng
                  </Link>
                ) : (
                  <button
                    className="doctor-button doctor-button--secondary"
                    style={{ cursor: 'pointer', color: '#000' }}
                    onClick={() => setIsRegistering(true)}
                  >
                    Mở tài khoản bác sĩ
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

              {activityStatus && (
                <DoctorStatusBadge label={activityStatus.label} tone={activityStatus.tone} />
              )}

              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã hồ sơ bác sĩ</span>
                  <span className="doctor-keyfact__value">#{rawData.maBacSi}</span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã CCHN</span>
                  <span className="doctor-keyfact__value">{rawData.maChungChiHanhNghe || 'Chưa có'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="doctor-metrics-grid">
            <DoctorStatCard label="Tài khoản" value={activityStatus?.label ?? "—"} hint="Trạng thái truy cập hệ thống." />
            <DoctorStatCard label="Hồ sơ bác sĩ" value={profileStatus?.label ?? "—"} hint={profileStatus?.description ?? "Kiểm tra hồ sơ định kỳ."} />
            <DoctorStatCard label="Chuyên khoa" value={rawData.chuyenKhoa ?? "Chưa cập nhật"} hint="Hiển thị với bệnh nhân." />
            <DoctorStatCard label="Cơ sở y tế" value={rawData.tenCoSoYTe ?? "Chưa cập nhật"} hint="Bệnh viện đang công tác." />
          </section>

          {rawData.coTaiKhoanBacSi ? (
            <div className="doctor-request-grid">
              <DoctorPanel
                title="Dữ liệu hồ sơ hiện tại"
                description="Các thông tin này được quản trị viên dùng để xét duyệt năng lực."
                aside={profileStatus && <DoctorStatusBadge label={profileStatus.label} tone={profileStatus.tone} />}
              >
                <div className="doctor-meta-list">
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Họ tên bác sĩ</span>
                    <div className="doctor-meta-item__value">{rawData.hoLot} {rawData.ten}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Mã chứng chỉ</span>
                    <div className="doctor-meta-item__value">{rawData.maChungChiHanhNghe}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Nơi công tác</span>
                    <div className="doctor-meta-item__value">{rawData.tenCoSoYTe}</div>
                  </div>
                </div>
              </DoctorPanel>
            </div>
          ) : (
            <DoctorPanel title="Hồ sơ bác sĩ">
              <DoctorEmptyState
                title="Bạn chưa có hồ sơ bác sĩ"
                description={rawData.trangThaiHoSo === "CHO_DUYET" ? "Hồ sơ đang chờ duyệt." : "Hãy mở tài khoản bác sĩ để bắt đầu hành nghề."}
                action={
                  rawData.trangThaiHoSo === "CHO_DUYET" ? (
                    <Link className="doctor-button doctor-button--primary doctor-button-link" to="/app/account" style={{ color: '#000' }}>
                      Quay lại hồ sơ cá nhân
                    </Link>
                  ) : (
                    <button className="doctor-button doctor-button--primary" style={{ color: '#000' }} onClick={() => setIsRegistering(true)}>
                      Mở tài khoản bác sĩ
                    </button>
                  )
                }
              />
            </DoctorPanel>
          )}
        </>
      ) : null}
    </div>
  );
}