import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
  const { session } = useAuth();
  const maTaiKhoan = session?.maTaiKhoan ?? null;

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

  return (
    <div className="doctor-page">
      {/* ── Tiêu đề ── */}
      <DoctorPageHeading
        eyebrow="Account"
        title="Trạng thái hồ sơ"
        description="Thông tin tài khoản và hồ sơ bác sĩ liên kết với phiên đăng nhập hiện tại."
        actions={
          <Link
            className="doctor-button doctor-button--secondary doctor-button-link"
            to="/app/account"
          >
            Chỉnh sửa hồ sơ
          </Link>
        }
      />

      {/* ── Loading ── */}
      {query.isLoading ? (
        <DoctorNotice
          tone="info"
          title="Đang tải thông tin"
          description="Hệ thống đang lấy dữ liệu hồ sơ từ backend..."
        />
      ) : null}

      {rawData ? (
        <>
          {/* ── Hero: Thông tin chính ── */}
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">
                Thông tin tài khoản mẫu
              </div>
              <h2 className="doctor-hero__title">
                {rawData.hoLot} {rawData.ten}
              </h2>
              <p className="doctor-hero__subtitle">{rawData.email}</p>

              <div className="doctor-button-row">
                <Link
                  className="doctor-button doctor-button--primary doctor-button-link"
                  to={`/app/doctors/${rawData.maBacSi}`}
                >
                  Xem hồ sơ công khai
                </Link>
                {rawData.coTaiKhoanBacSi ? (
                  <Link
                    className="doctor-button doctor-button--secondary doctor-button-link"
                    to="/doctor/documents"
                  >
                    Quản lý minh chứng
                  </Link>
                ) : (
                  <Link
                    className="doctor-button doctor-button--secondary doctor-button-link"
                    to="/register"
                  >
                    Mở tài khoản bác sĩ
                  </Link>
                )}
              </div>
            </div>

            <div className="doctor-hero__aside">
              <div className="doctor-profile-strip">
                <DoctorAvatar name={`${rawData.hoLot} ${rawData.ten}`} />
                <div>
                  <h3 className="doctor-profile-strip__name">
                    {rawData.hoLot} {rawData.ten}
                  </h3>
                  <p className="doctor-profile-strip__meta">
                    {rawData.chuyenKhoa}
                    <br />
                    {rawData.tenCoSoYTe}
                  </p>
                </div>
              </div>

              {activityStatus && (
                <DoctorStatusBadge
                  label={activityStatus.label}
                  tone={activityStatus.tone}
                />
              )}

              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã hồ sơ bác sĩ</span>
                  <span className="doctor-keyfact__value">
                    #{rawData.maBacSi}
                  </span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã CCHN</span>
                  <span className="doctor-keyfact__value">
                    {rawData.maChungChiHanhNghe}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Thẻ chỉ số (Stats) ── */}
          <section className="doctor-metrics-grid">
            <DoctorStatCard
              label="Tài khoản"
              value={activityStatus?.label ?? "—"}
              hint="Trạng thái truy cập hệ thống."
            />
            <DoctorStatCard
              label="Hồ sơ bác sĩ"
              value={profileStatus?.label ?? "—"}
              hint={profileStatus?.description ?? "Kiểm tra hồ sơ định kỳ."}
            />
            <DoctorStatCard
              label="Chuyên khoa"
              value={rawData.chuyenKhoa ?? "Chưa cập nhật"}
              hint="Hiển thị với bệnh nhân."
            />
            <DoctorStatCard
              label="Cơ sở y tế"
              value={rawData.tenCoSoYTe ?? "Chưa cập nhật"}
              hint="Bệnh viện đang công tác."
            />
          </section>

          {/* ── Panel chi tiết ── */}
          {rawData.coTaiKhoanBacSi ? (
            <div className="doctor-request-grid">
              <DoctorPanel
                title="Dữ liệu hồ sơ hiện tại"
                description="Các thông tin này được quản trị viên dùng để xét duyệt năng lực."
                aside={
                  profileStatus && (
                    <DoctorStatusBadge
                      label={profileStatus.label}
                      tone={profileStatus.tone}
                    />
                  )
                }
              >
                <div className="doctor-meta-list">
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Họ tên bác sĩ
                    </span>
                    <div className="doctor-meta-item__value">
                      {rawData.hoLot} {rawData.ten}
                    </div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Mã chứng chỉ
                    </span>
                    <div className="doctor-meta-item__value">
                      {rawData.maChungChiHanhNghe}
                    </div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Nơi công tác
                    </span>
                    <div className="doctor-meta-item__value">
                      {rawData.tenCoSoYTe}
                    </div>
                  </div>
                </div>
                <div className="doctor-divider" />
                <button
                  className="doctor-button doctor-button--ghost"
                  onClick={() => alert("Chỉnh sửa tại trang Account")}
                >
                  Yêu cầu cập nhật thông tin
                </button>
              </DoctorPanel>

              <DoctorPanel
                title="Thông tin hướng dẫn"
                description="Dành cho bác sĩ mới."
              >
                <div className="doctor-note-card">
                  <p className="doctor-note">
                    <strong>Lưu ý:</strong> Khi hồ sơ ở trạng thái Chờ duyệt,
                    bạn chỉ có thể xem, không thể sửa đổi thông tin.
                  </p>
                </div>
              </DoctorPanel>
            </div>
          ) : (
            <DoctorPanel title="Hồ sơ bác sĩ">
              <DoctorEmptyState
                title="Bạn chưa có hồ sơ bác sĩ"
                description={
                  rawData.trangThaiHoSo === "CHO_DUYET"
                    ? "Hồ sơ đang chờ duyệt."
                    : "Hãy mở tài khoản bác sĩ để bắt đầu hành nghề trên DoctorFinder."
                }
                action={
                  rawData.trangThaiHoSo === "CHO_DUYET" ? (
                    <Link
                      className="doctor-button doctor-button--primary doctor-button-link"
                      to="/app/account"
                    >
                      Quay lại hồ sơ cá nhân
                    </Link>
                  ) : (
                    <Link
                      className="doctor-button doctor-button--primary doctor-button-link"
                      to="/register"
                    >
                      Mở tài khoản bác sĩ
                    </Link>
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
