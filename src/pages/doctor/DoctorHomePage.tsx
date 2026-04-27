import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { DoctorProfile } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { getApiErrorMessage } from '../../utils/errors'
import {
  DoctorAvatar,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  getProfileStatusMeta,
} from './doctorUi'

const quickActions = [
  {
    tag: 'Lịch hẹn',
    title: 'Duyệt yêu cầu khám',
    description: 'Xem và phản hồi các phiếu đặt lịch đang chờ xác nhận.',
    to: '/doctor/requests',
  },
  {
    tag: 'Ca làm việc',
    title: 'Cập nhật khung giờ',
    description: 'Mở hoặc điều chỉnh lịch nhận bệnh theo ngày.',
    to: '/doctor/schedule',
  },
  {
    tag: 'Hồ sơ',
    title: 'Quản lý minh chứng',
    description: 'Tải lên và sắp xếp tài liệu xác minh chuyên môn.',
    to: '/doctor/documents',
  },
  {
    tag: 'Điều phối',
    title: 'Khu điều hành',
    description: 'Truy cập tổng thể toàn bộ công cụ vận hành.',
    to: '/doctor/workspace',
  },
]

export function DoctorHomePage() {
  const { session } = useAuth()
  const maTaiKhoan = session?.maTaiKhoan ?? null

  const query = useQuery({
    queryKey: ['doctor-by-account', maTaiKhoan],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/by-account/${maTaiKhoan}`)).data,
    enabled: !!maTaiKhoan,
  })

  const profile = query.data
  const profileStatus = profile ? getProfileStatusMeta(profile.trangThaiHoSo) : null
  const needsAttention = profile && profile.trangThaiHoSo !== 'DA_DUYET'

  return (
      <div className="doctor-page">

        {/* ── Tiêu đề trang ── */}
        <DoctorPageHeading
            eyebrow="Doctor dashboard"
            title="Tổng quan công việc"
            description="Theo dõi hồ sơ, lịch nhận bệnh và các đầu việc quan trọng trong một không gian trực quan."
            actions={
              <>
                <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/workspace">
                  Trung tâm điều phối
                </Link>
                <Link className="doctor-button doctor-button--primary doctor-button-link" to="/doctor/requests">
                  Lịch hẹn chờ duyệt
                </Link>
              </>
            }
        />

        {/* ── Loading / Error ── */}
        {query.isLoading ? (
            <DoctorNotice
                tone="info"
                title="Đang tải dữ liệu"
                description="Hệ thống đang tổng hợp thông tin hồ sơ bác sĩ của bạn."
            />
        ) : null}

        {query.isError ? (
            <DoctorNotice
                tone="danger"
                title="Không thể tải hồ sơ"
                description={
                  (query.error as any)?.response?.status === 404
                      ? 'Tài khoản chưa liên kết hồ sơ bác sĩ. Vui lòng kiểm tra lại thông tin nâng cấp tài khoản.'
                      : getApiErrorMessage(query.error)
                }
            />
        ) : null}

        {profile ? (
            <>

              {/* ── Cảnh báo hồ sơ (chỉ hiện khi cần) ── */}
              {needsAttention && profileStatus ? (
                  <DoctorNotice
                      tone={profileStatus.tone}
                      title="Hồ sơ cần được theo dõi"
                      description={profileStatus.description ?? 'Hãy kiểm tra và cập nhật hồ sơ để duy trì vận hành ổn định.'}
                      action={
                        <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/documents">
                          Bổ sung tài liệu
                        </Link>
                      }
                  />
              ) : null}

              {/* ── Hero: thông tin bác sĩ ── */}
              <section className="doctor-hero">
                <div className="doctor-hero__content">
                  <div className="doctor-hero__eyebrow">Không gian làm việc hôm nay</div>
                  <h2 className="doctor-hero__title">
                    Sẵn sàng tiếp nhận bệnh nhân với lịch làm việc và hồ sơ được quản lý rõ ràng.
                  </h2>
                  <p className="doctor-hero__subtitle">
                    Nắm nhanh tình trạng hồ sơ, chuyên khoa phụ trách và các thao tác cần ưu tiên trong ngày làm việc.
                  </p>
                  <div className="doctor-button-row">
                    <Link className="doctor-button doctor-button--primary doctor-button-link" to="/doctor/schedule">
                      Cập nhật lịch làm việc
                    </Link>
                    <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/documents">
                      Quản lý minh chứng
                    </Link>
                  </div>
                </div>

                <div className="doctor-hero__aside">
                  <div className="doctor-profile-strip">
                    <DoctorAvatar name={profile.hoTenDayDu} imageUrl={profile.anhDaiDien} />
                    <div>
                      <h3 className="doctor-profile-strip__name">{profile.hoTenDayDu}</h3>
                      <p className="doctor-profile-strip__meta">
                        {profile.chuyenKhoa}
                        <br />
                        {profile.tenCoSoYTe}
                      </p>
                    </div>
                  </div>

                  {profileStatus ? (
                      <DoctorStatusBadge label={profileStatus.label} tone={profileStatus.tone} />
                  ) : null}

                  <div className="doctor-keyfacts">
                    <div className="doctor-keyfact">
                      <span className="doctor-keyfact__label">Trình độ</span>
                      <span className="doctor-keyfact__value">{profile.trinhDoChuyenMon}</span>
                    </div>
                    <div className="doctor-keyfact">
                      <span className="doctor-keyfact__label">Liên hệ</span>
                      <span className="doctor-keyfact__value">
                    {profile.soDienThoai} · {profile.email}
                  </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Số liệu tổng quan ── */}
              <section className="doctor-metrics-grid">
                <DoctorStatCard
                    label="Trạng thái hồ sơ"
                    value={profileStatus?.label ?? profile.trangThaiHoSo}
                    hint={profileStatus?.description}
                />
                <DoctorStatCard
                    label="Chuyên khoa"
                    value={profile.chuyenKhoa}
                    hint="Khu vực chuyên môn đang hiển thị với bệnh nhân."
                />
                <DoctorStatCard
                    label="Cơ sở y tế"
                    value={profile.tenCoSoYTe}
                    hint={profile.diaChiLamViec || 'Địa chỉ làm việc sẽ hiển thị khi được cập nhật.'}
                />
                <DoctorStatCard
                    label="Mã chứng chỉ"
                    value={profile.maChungChiHanhNghe}
                    hint="Kiểm tra minh chứng để đảm bảo hồ sơ luôn đầy đủ."
                />
              </section>

              {/* ── Tác vụ + Thông tin hiển thị ── */}
              <div className="doctor-request-grid">

                <DoctorPanel
                    title="Tác vụ ưu tiên"
                    description="Các đầu việc chính theo luồng vận hành thường ngày."
                >
                  <div className="doctor-action-grid">
                    {quickActions.map((action) => (
                        <Link key={action.to} className="doctor-action-card" to={action.to}>
                          <span className="doctor-action-card__tag">{action.tag}</span>
                          <span className="doctor-action-card__title">{action.title}</span>
                          <p className="doctor-action-card__description">{action.description}</p>
                        </Link>
                    ))}
                  </div>
                </DoctorPanel>

                <DoctorPanel
                    title="Thông tin hiển thị với bệnh nhân"
                    description="Dữ liệu nhận diện đang được dùng trên hệ thống."
                >
                  <div className="doctor-meta-list">
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Họ và tên</span>
                      <div className="doctor-meta-item__value">{profile.hoTenDayDu}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Loại hình</span>
                      <div className="doctor-meta-item__value">{profile.loaiHinhBacSi}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Địa chỉ làm việc</span>
                      <div className="doctor-meta-item__value">
                        {profile.diaChiLamViec || 'Chưa cập nhật.'}
                      </div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Mô tả bản thân</span>
                      <div className="doctor-meta-item__value">
                        {profile.moTaBanThan || 'Chưa có mô tả. Bổ sung tại hồ sơ cá nhân.'}
                      </div>
                    </div>
                  </div>

                  <div className="doctor-divider" />

                  <Link
                      className="doctor-button doctor-button--ghost doctor-button-link"
                      to="/doctor/account"
                      style={{ alignSelf: 'flex-start' }}
                  >
                    Xem & chỉnh hồ sơ cá nhân
                  </Link>
                </DoctorPanel>

              </div>

            </>
        ) : null}
      </div>
  )
}