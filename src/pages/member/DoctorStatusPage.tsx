import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AccountDoctorInfo } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { getApiErrorMessage } from '../../utils/errors'
import {
  DoctorAvatar,
  DoctorEmptyState,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  getProfileStatusMeta,
} from '../doctor/doctorUi'

function getActivityStatusMeta(status: string | null | undefined) {
  switch (status) {
    case 'HOAT_DONG':   return { label: 'Đang hoạt động', tone: 'success' as const }
    case 'BI_KHOA':     return { label: 'Tài khoản bị khóa', tone: 'danger' as const }
    case 'CHO_DUYET':   return { label: 'Chờ kích hoạt', tone: 'warning' as const }
    default:            return { label: status ?? 'Chưa xác định', tone: 'neutral' as const }
  }
}

export function DoctorStatusPage() {
  const { session } = useAuth()
  const maTaiKhoan = session?.maTaiKhoan ?? null

  const query = useQuery({
    queryKey: ['doctor-status', maTaiKhoan],
    queryFn: async () => (await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`)).data,
    enabled: !!maTaiKhoan,
  })

  const data = query.data
  const activityStatus = data ? getActivityStatusMeta(data.trangThaiHoatDong) : null
  const profileStatus  = data?.trangThaiHoSo ? getProfileStatusMeta(data.trangThaiHoSo) : null

  return (
    <div className="doctor-page">

      {/* ── Tiêu đề ── */}
      <DoctorPageHeading
        eyebrow="Account"
        title="Trạng thái hồ sơ"
        description="Thông tin tài khoản và hồ sơ bác sĩ liên kết với phiên đăng nhập hiện tại."
        actions={
          <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/home">
            Về trang chủ
          </Link>
        }
      />

      {/* ── Lỗi / loading ── */}
      {!maTaiKhoan ? (
        <DoctorNotice
          tone="danger"
          title="Thiếu thông tin phiên đăng nhập"
          description="Không tìm thấy mã tài khoản. Hãy đăng xuất và đăng nhập lại."
        />
      ) : null}

      {query.isLoading ? (
        <DoctorNotice
          tone="info"
          title="Đang tải thông tin tài khoản"
          description="Hệ thống đang xác thực và tổng hợp dữ liệu hồ sơ của bạn."
        />
      ) : null}

      {query.isError ? (
        <DoctorNotice
          tone="danger"
          title="Không thể tải thông tin tài khoản"
          description={getApiErrorMessage(query.error)}
        />
      ) : null}

      {data ? (
        <>
          {/* ── Hero: thông tin tài khoản ── */}
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Thông tin tài khoản</div>
              <h2 className="doctor-hero__title">
                {data.hoLot} {data.ten}
              </h2>
              <p className="doctor-hero__subtitle">{data.email}</p>

              <div className="doctor-button-row">
                {data.maBacSi ? (
                  <Link
                    className="doctor-button doctor-button--primary doctor-button-link"
                    to={`/app/doctors/${data.maBacSi}`}
                  >
                    Xem hồ sơ công khai
                  </Link>
                ) : null}
                <Link
                  className="doctor-button doctor-button--secondary doctor-button-link"
                  to="/doctor/documents"
                >
                  Quản lý minh chứng
                </Link>
              </div>
            </div>

            <div className="doctor-hero__aside">
              <div className="doctor-profile-strip">
                <DoctorAvatar name={`${data.hoLot ?? ''} ${data.ten ?? ''}`} />
                <div>
                  <h3 className="doctor-profile-strip__name">
                    {data.hoLot} {data.ten}
                  </h3>
                  <p className="doctor-profile-strip__meta">
                    {data.chuyenKhoa || 'Chưa có chuyên khoa'}
                    <br />
                    {data.tenCoSoYTe || 'Chưa có cơ sở y tế'}
                  </p>
                </div>
              </div>

              {activityStatus ? (
                <DoctorStatusBadge label={activityStatus.label} tone={activityStatus.tone} />
              ) : null}

              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã hồ sơ bác sĩ</span>
                  <span className="doctor-keyfact__value">
                    {data.maBacSi ? `#${data.maBacSi}` : 'Chưa liên kết'}
                  </span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã chứng chỉ hành nghề</span>
                  <span className="doctor-keyfact__value">
                    {data.maChungChiHanhNghe || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Stat grid ── */}
          <section className="doctor-metrics-grid">
            <DoctorStatCard
              label="Trạng thái tài khoản"
              value={activityStatus?.label ?? '—'}
              hint="Phản ánh khả năng truy cập và vận hành trên hệ thống."
            />
            <DoctorStatCard
              label="Trạng thái hồ sơ"
              value={profileStatus?.label ?? data.trangThaiHoSo ?? '—'}
              hint={profileStatus?.description ?? 'Kiểm tra và cập nhật hồ sơ để duy trì hoạt động.'}
            />
            <DoctorStatCard
              label="Chuyên khoa"
              value={data.chuyenKhoa || 'Chưa cập nhật'}
              hint="Chuyên khoa đang hiển thị với bệnh nhân trên hệ thống."
            />
            <DoctorStatCard
              label="Cơ sở y tế"
              value={data.tenCoSoYTe || 'Chưa cập nhật'}
              hint="Nơi công tác đang được liên kết với hồ sơ bác sĩ."
            />
          </section>

          {/* ── Hồ sơ bác sĩ ── */}
          {data.coTaiKhoanBacSi ? (
            <div className="doctor-request-grid">

              <DoctorPanel
                title="Chi tiết hồ sơ bác sĩ"
                description="Các thông tin chuyên môn đang được lưu trữ và hiển thị trên hệ thống."
                aside={
                  profileStatus ? (
                    <DoctorStatusBadge label={profileStatus.label} tone={profileStatus.tone} />
                  ) : null
                }
              >
                <div className="doctor-meta-list">
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Họ và tên</span>
                    <div className="doctor-meta-item__value">{data.hoLot} {data.ten}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Email</span>
                    <div className="doctor-meta-item__value">{data.email}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Chuyên khoa</span>
                    <div className="doctor-meta-item__value">{data.chuyenKhoa || '—'}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Cơ sở y tế</span>
                    <div className="doctor-meta-item__value">{data.tenCoSoYTe || '—'}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Mã hồ sơ</span>
                    <div className="doctor-meta-item__value">
                      {data.maBacSi ? `#${data.maBacSi}` : '—'}
                    </div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Mã CCHN</span>
                    <div className="doctor-meta-item__value">
                      {data.maChungChiHanhNghe || '—'}
                    </div>
                  </div>
                </div>

                <div className="doctor-divider" />

                <div className="doctor-button-row">
                  {data.maBacSi ? (
                    <Link
                      className="doctor-button doctor-button--primary doctor-button-link"
                      to={`/app/doctors/${data.maBacSi}`}
                    >
                      Xem hồ sơ công khai
                    </Link>
                  ) : null}
                  <Link
                    className="doctor-button doctor-button--ghost doctor-button-link"
                    to="/doctor/documents"
                  >
                    Bổ sung minh chứng
                  </Link>
                </div>
              </DoctorPanel>

              <DoctorPanel
                title="Hướng dẫn vận hành"
                description="Các bước cần thực hiện để hoàn thiện và duy trì hồ sơ hành nghề."
              >
                <div className="doctor-section-stack">
                  <div className="doctor-note-card">
                    <p className="doctor-note">
                      Hồ sơ ở trạng thái <strong>Chờ duyệt</strong> hoặc <strong>Từ chối</strong> sẽ bị giới hạn một số chức năng nhận lịch hẹn.
                    </p>
                  </div>
                  <div className="doctor-note-card">
                    <p className="doctor-note">
                      Tải đầy đủ minh chứng chuyên môn (chứng chỉ hành nghề, bằng cấp) để quá trình duyệt hồ sơ diễn ra nhanh hơn.
                    </p>
                  </div>
                  <div className="doctor-note-card">
                    <p className="doctor-note">
                      Sau khi hồ sơ được duyệt, bạn có thể thiết lập lịch làm việc và bắt đầu nhận lịch hẹn từ bệnh nhân.
                    </p>
                  </div>
                  <div className="doctor-note-card">
                    <p className="doctor-note">
                      Kiểm tra định kỳ thông tin cơ sở y tế và chuyên khoa để đảm bảo dữ liệu hiển thị với bệnh nhân luôn chính xác.
                    </p>
                  </div>
                </div>

                <div className="doctor-divider" />

                <Link
                  className="doctor-button doctor-button--secondary doctor-button-link"
                  to="/doctor/schedule"
                  style={{ alignSelf: 'flex-start' }}
                >
                  Thiết lập lịch làm việc
                </Link>
              </DoctorPanel>

            </div>
          ) : (
            /* Chưa có hồ sơ bác sĩ */
            <DoctorPanel title="Hồ sơ bác sĩ" description="Tài khoản này chưa liên kết hồ sơ bác sĩ.">
              <DoctorEmptyState
                title="Chưa có hồ sơ bác sĩ"
                description="Bạn cần mở hồ sơ bác sĩ để có thể đăng ký hành nghề và tiếp nhận lịch hẹn từ bệnh nhân trên hệ thống."
                action={
                  <Link className="doctor-button doctor-button--primary doctor-button-link" to="/app/account">
                    Mở hồ sơ bác sĩ
                  </Link>
                }
              />
            </DoctorPanel>
          )}
        </>
      ) : null}
    </div>
  )
}