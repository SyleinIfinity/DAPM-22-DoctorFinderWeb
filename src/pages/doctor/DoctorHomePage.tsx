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

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Doctor dashboard"
        title="Tổng quan công việc bác sĩ"
        description="Theo dõi hồ sơ, lịch nhận bệnh và các đầu việc quan trọng trong một không gian trực quan, gọn và đồng bộ."
        actions={
          <>
            <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/workspace">
              Mở trung tâm điều phối
            </Link>
            <Link className="doctor-button doctor-button--primary doctor-button-link" to="/doctor/requests">
              Xem lịch hẹn chờ duyệt
            </Link>
          </>
        }
      />

      {query.isLoading ? (
        <DoctorNotice
          tone="info"
          title="Đang tải dữ liệu bác sĩ"
          description="Hệ thống đang tổng hợp thông tin hồ sơ và khu vực làm việc của bạn."
        />
      ) : null}

      {query.isError ? (
        <DoctorNotice
          tone="danger"
          title="Không thể tải hồ sơ bác sĩ"
          description={
            (query.error as any)?.response?.status === 404
              ? 'Tài khoản hiện chưa liên kết hồ sơ bác sĩ. Vui lòng kiểm tra lại thông tin nâng cấp tài khoản.'
              : getApiErrorMessage(query.error)
          }
        />
      ) : null}

      {profile ? (
        <>
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Không gian làm việc hôm nay</div>
              <h2 className="doctor-hero__title">Sẵn sàng tiếp nhận bệnh nhân với lịch làm việc và hồ sơ được quản lý rõ ràng.</h2>
              <p className="doctor-hero__subtitle">
                Khu vực này giúp bác sĩ nắm nhanh tình trạng hồ sơ, chuyên khoa phụ trách và các thao tác cần ưu tiên trong ngày.
              </p>

              <div className="doctor-button-row">
                <Link className="doctor-button doctor-button--primary doctor-button-link" to="/doctor/schedule">
                  Cập nhật lịch làm việc
                </Link>
                <Link className="doctor-button doctor-button--ghost doctor-button-link" to="/doctor/documents">
                  Quản lý minh chứng
                </Link>
                <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/account">
                  Xem hồ sơ cá nhân
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

              <DoctorStatusBadge label={profileStatus?.label ?? 'Chưa có trạng thái'} tone={profileStatus?.tone ?? 'neutral'} />

              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Trình độ chuyên môn</span>
                  <span className="doctor-keyfact__value">{profile.trinhDoChuyenMon}</span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Loại hình bác sĩ</span>
                  <span className="doctor-keyfact__value">{profile.loaiHinhBacSi}</span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Liên hệ</span>
                  <span className="doctor-keyfact__value">
                    {profile.soDienThoai}
                    <br />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="doctor-stat-grid">
            <DoctorStatCard
              label="Trạng thái hồ sơ"
              value={profileStatus?.label ?? profile.trangThaiHoSo}
              hint={profileStatus?.description}
            />
            <DoctorStatCard label="Chuyên khoa" value={profile.chuyenKhoa} hint="Khu vực chuyên môn đang hiển thị với bệnh nhân." />
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

          {profileStatus && profile.trangThaiHoSo !== 'DA_DUYET' ? (
            <DoctorNotice
              tone={profileStatus.tone}
              title="Hồ sơ cần được theo dõi"
              description={profileStatus.description ?? 'Hãy kiểm tra và cập nhật hồ sơ bác sĩ để duy trì vận hành ổn định.'}
              action={
                <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/documents">
                  Bổ sung tài liệu
                </Link>
              }
            />
          ) : null}

          <div className="doctor-request-grid">
            <DoctorPanel
              title="Tác vụ ưu tiên"
              description="Các đầu việc chính được gom theo luồng vận hành thường ngày của bác sĩ."
            >
              <div className="doctor-action-grid">
                <Link className="doctor-action-card" to="/doctor/requests">
                  <span className="doctor-action-card__tag">Lịch hẹn</span>
                  <span className="doctor-action-card__title">Duyệt yêu cầu khám</span>
                  <p className="doctor-action-card__description">
                    Xem danh sách bệnh nhân đang chờ xác nhận và phản hồi trực tiếp trên từng phiếu đặt lịch.
                  </p>
                </Link>
                <Link className="doctor-action-card" to="/doctor/schedule">
                  <span className="doctor-action-card__tag">Lịch làm việc</span>
                  <span className="doctor-action-card__title">Tinh chỉnh khung giờ</span>
                  <p className="doctor-action-card__description">
                    Chủ động cập nhật giờ làm việc, thời lượng mỗi ca và trạng thái nhận lịch.
                  </p>
                </Link>
                <Link className="doctor-action-card" to="/doctor/documents">
                  <span className="doctor-action-card__tag">Hồ sơ</span>
                  <span className="doctor-action-card__title">Quản lý minh chứng</span>
                  <p className="doctor-action-card__description">
                    Tải lên, mở lại và sắp xếp tài liệu phục vụ xác minh hồ sơ chuyên môn.
                  </p>
                </Link>
                <Link className="doctor-action-card" to="/doctor/workspace">
                  <span className="doctor-action-card__tag">Điều phối</span>
                  <span className="doctor-action-card__title">Mở khu điều hành</span>
                  <p className="doctor-action-card__description">
                    Theo dõi tổng thể các luồng xử lý và truy cập nhanh toàn bộ công cụ làm việc.
                  </p>
                </Link>
              </div>
            </DoctorPanel>

            <DoctorPanel title="Thông tin hiển thị với bệnh nhân" description="Kiểm tra nhanh các dữ liệu nhận diện và hành nghề đang được dùng trên hệ thống.">
              <div className="doctor-meta-list">
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Họ và tên</span>
                  <div className="doctor-meta-item__value">{profile.hoTenDayDu}</div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Cơ sở y tế</span>
                  <div className="doctor-meta-item__value">{profile.tenCoSoYTe}</div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Địa chỉ làm việc</span>
                  <div className="doctor-meta-item__value">{profile.diaChiLamViec || 'Chưa cập nhật địa chỉ làm việc.'}</div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Mô tả bản thân</span>
                  <div className="doctor-meta-item__value">
                    {profile.moTaBanThan || 'Chưa có mô tả giới thiệu. Bạn có thể bổ sung tại hồ sơ cá nhân.'}
                  </div>
                </div>
              </div>
            </DoctorPanel>
          </div>
        </>
      ) : null}
    </div>
  )
}
