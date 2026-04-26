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

const workflowSteps = [
  {
    tag: 'Bước 1',
    title: 'Tiếp nhận yêu cầu khám',
    description: 'Kiểm tra yêu cầu mới, xem nhanh triệu chứng ghi chú và phản hồi ngay trong danh sách lịch hẹn.',
    to: '/doctor/requests',
  },
  {
    tag: 'Bước 2',
    title: 'Điều chỉnh lịch làm việc',
    description: 'Cập nhật thời gian nhận bệnh phù hợp theo ngày, trạng thái lịch và năng lực tiếp nhận của từng ca.',
    to: '/doctor/schedule',
  },
  {
    tag: 'Bước 3',
    title: 'Hoàn thiện minh chứng',
    description: 'Duy trì hồ sơ minh chứng gọn gàng để phục vụ xác thực và hỗ trợ đội vận hành khi cần.',
    to: '/doctor/documents',
  },
  {
    tag: 'Bước 4',
    title: 'Kiểm tra hồ sơ cá nhân',
    description: 'Rà soát thông tin chuyên môn, nơi công tác và phần mô tả để tăng độ tin cậy với bệnh nhân.',
    to: '/doctor/account',
  },
]

export function DoctorWorkspacePage() {
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
        eyebrow="Clinical workspace"
        title="Trung tâm điều phối công việc"
        description="Một điểm truy cập tập trung cho toàn bộ đầu việc vận hành của bác sĩ: lịch làm việc, duyệt yêu cầu và kiểm soát hồ sơ."
        actions={
          <Link className="doctor-button doctor-button--primary doctor-button-link" to="/doctor/home">
            Quay về tổng quan
          </Link>
        }
      />

      {query.isLoading ? (
        <DoctorNotice
          tone="info"
          title="Đang tải không gian làm việc"
          description="Hệ thống đang kết nối thông tin hồ sơ bác sĩ để dựng bảng điều phối."
        />
      ) : null}

      {query.isError ? (
        <DoctorNotice
          tone="danger"
          title="Không thể khởi tạo khu điều phối"
          description={
            (query.error as any)?.response?.status === 404
              ? 'Tài khoản hiện chưa có hồ sơ bác sĩ. Hãy kiểm tra lại quá trình đăng ký hoặc nâng cấp tài khoản.'
              : getApiErrorMessage(query.error)
          }
        />
      ) : null}

      {profile ? (
        <>
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Bảng điều hành cá nhân</div>
              <h2 className="doctor-hero__title">Sắp xếp công việc khám chữa bệnh theo một quy trình rõ ràng và chuẩn chỉnh.</h2>
              <p className="doctor-hero__subtitle">
                Mỗi khối chức năng được tách riêng để bác sĩ xử lý lịch hẹn, minh chứng và thông tin cá nhân mà không bị rối giao diện.
              </p>

              <div className="doctor-button-row">
                <Link className="doctor-button doctor-button--primary doctor-button-link" to="/doctor/requests">
                  Mở danh sách yêu cầu
                </Link>
                <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/schedule">
                  Xem lịch làm việc
                </Link>
              </div>
            </div>

            <div className="doctor-hero__aside">
              <div className="doctor-profile-strip">
                <DoctorAvatar name={profile.hoTenDayDu} imageUrl={profile.anhDaiDien} />
                <div>
                  <h3 className="doctor-profile-strip__name">{profile.hoTenDayDu}</h3>
                  <p className="doctor-profile-strip__meta">
                    {profile.trinhDoChuyenMon}
                    <br />
                    {profile.tenCoSoYTe}
                  </p>
                </div>
              </div>

              <DoctorStatusBadge label={profileStatus?.label ?? profile.trangThaiHoSo} tone={profileStatus?.tone ?? 'neutral'} />

              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Chuyên khoa phụ trách</span>
                  <span className="doctor-keyfact__value">{profile.chuyenKhoa}</span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Địa chỉ làm việc</span>
                  <span className="doctor-keyfact__value">{profile.diaChiLamViec || 'Chưa cập nhật địa chỉ làm việc.'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="doctor-stat-grid">
            <DoctorStatCard label="Hồ sơ hành nghề" value={profileStatus?.label ?? profile.trangThaiHoSo} hint={profileStatus?.description} />
            <DoctorStatCard label="Cơ sở công tác" value={profile.tenCoSoYTe} hint="Giữ thông tin nơi công tác đồng nhất với hồ sơ bệnh nhân nhìn thấy." />
            <DoctorStatCard label="Kênh liên hệ" value={profile.soDienThoai} hint={profile.email} />
            <DoctorStatCard label="Loại hình bác sĩ" value={profile.loaiHinhBacSi} hint="Thông tin này hỗ trợ định vị vai trò chuyên môn của bạn trên hệ thống." />
          </section>

          <div className="doctor-request-grid">
            <DoctorPanel title="Quy trình làm việc đề xuất" description="Bố cục thao tác theo luồng thực tế để việc theo dõi và xử lý hàng ngày luôn mạch lạc.">
              <div className="doctor-action-grid">
                {workflowSteps.map((step) => (
                  <Link key={step.title} className="doctor-action-card" to={step.to}>
                    <span className="doctor-action-card__tag">{step.tag}</span>
                    <span className="doctor-action-card__title">{step.title}</span>
                    <p className="doctor-action-card__description">{step.description}</p>
                  </Link>
                ))}
              </div>
            </DoctorPanel>

            <DoctorPanel title="Thông tin chuyên môn hiện tại" description="Các dữ liệu nền tảng phục vụ xác thực và nhận diện hồ sơ bác sĩ trên hệ thống.">
              <div className="doctor-meta-list">
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Mã chứng chỉ hành nghề</span>
                  <div className="doctor-meta-item__value">{profile.maChungChiHanhNghe}</div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Trình độ chuyên môn</span>
                  <div className="doctor-meta-item__value">{profile.trinhDoChuyenMon}</div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Mô tả bản thân</span>
                  <div className="doctor-meta-item__value">
                    {profile.moTaBanThan || 'Chưa có mô tả giới thiệu. Điều này nên được bổ sung để hồ sơ hoàn chỉnh hơn.'}
                  </div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Tài khoản đăng nhập</span>
                  <div className="doctor-meta-item__value">{profile.tenDangNhap}</div>
                </div>
              </div>
            </DoctorPanel>
          </div>

          {profileStatus && profile.trangThaiHoSo !== 'DA_DUYET' ? (
            <DoctorNotice
              tone={profileStatus.tone}
              title="Trạng thái hồ sơ ảnh hưởng đến vận hành"
              description={profileStatus.description ?? 'Một số chức năng có thể bị giới hạn cho đến khi hồ sơ bác sĩ được hoàn tất.'}
              action={
                <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/documents">
                  Đi tới minh chứng
                </Link>
              }
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
