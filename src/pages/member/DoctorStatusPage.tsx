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
      <div className="doctor-page">
        <DoctorPageHeading
          eyebrow="Nâng cấp tài khoản"
          title="Đăng ký chuyên môn Bác sĩ"
          description="Vui lòng cung cấp thông tin chuyên môn để quản trị viên phê duyệt hồ sơ của bạn."
        />
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <DoctorPanel title={step === 1 ? "Bước 1: Thông tin nghề nghiệp" : "Bước 2: Chứng chỉ chuyên môn"}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {step === 1 ? (
                <>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Chuyên khoa</span>
                    <input type="text" placeholder="Ví dụ: Nội khoa, Da liễu..." className="doctor-input" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000' }} />
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Cơ sở y tế công tác</span>
                    <input type="text" placeholder="Tên bệnh viện/phòng khám" className="doctor-input" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="doctor-button doctor-button--primary" style={{ flex: 1, color: '#000' }} onClick={() => setStep(2)}>Tiếp theo</button>
                    <button className="doctor-button doctor-button--ghost" style={{ color: '#000' }} onClick={() => setIsRegistering(false)}>Hủy bỏ</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ border: '2px dashed #ddd', padding: '30px', textAlign: 'center', borderRadius: '12px' }}>
                    <p style={{ color: '#000' }}>Tải lên ảnh Chứng chỉ hành nghề (mặt trước/mặt sau)</p>
                    <input type="file" style={{ marginTop: '10px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="doctor-button doctor-button--primary" style={{ flex: 1, color: '#000' }} onClick={() => {
                      alert("Đã gửi hồ sơ đăng ký thành công! Hệ thống sẽ phản hồi sớm.");
                      setIsRegistering(false);
                      query.refetch();
                    }}>Hoàn tất đăng ký</button>
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
            style={{ color: '#000' }} // Fix màu chữ nút Header
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
              <div className="doctor-hero__eyebrow">Thông tin tài khoản mẫu</div>
              <h2 className="doctor-hero__title">{rawData.hoLot} {rawData.ten}</h2>
              <p className="doctor-hero__subtitle">{rawData.email}</p>

              <div className="doctor-button-row">
                <Link
                  className="doctor-button doctor-button--primary doctor-button-link"
                  to={`/app/doctors/${rawData.maBacSi}`}
                  style={{ color: '#000' }} // Fix màu chữ nút Xem hồ sơ
                >
                  Xem hồ sơ công khai
                </Link>
                
                {rawData.coTaiKhoanBacSi ? (
                  <Link
                    className="doctor-button doctor-button--secondary doctor-button-link"
                    to="/doctor/documents"
                    style={{ color: '#000' }} // Fix màu chữ nút Quản lý
                  >
                    Quản lý minh chứng
                  </Link>
                ) : (
                  <button
                    className="doctor-button doctor-button--secondary"
                    style={{ cursor: 'pointer', color: '#000' }} // Fix màu chữ nút Mở tài khoản
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
                  <span className="doctor-keyfact__value">{rawData.maChungChiHanhNghe}</span>
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
                <div className="doctor-divider" />
                <button className="doctor-button doctor-button--ghost" style={{ color: '#000' }} onClick={() => alert("Chỉnh sửa tại trang Account")}>
                  Yêu cầu cập nhật thông tin
                </button>
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