import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { DoctorProfile } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function DoctorHomePage() {
  const { session } = useAuth()
  const maTaiKhoan = session?.maTaiKhoan ?? null

  const query = useQuery({
    queryKey: ['doctor-by-account', maTaiKhoan],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/by-account/${maTaiKhoan}`)).data,
    enabled: !!maTaiKhoan,
  })

  return (
    <>
      <PageHeader title="Dashboard bác sĩ" />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}

      {query.data ? (
        <div className="card stack">
          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{query.data.hoTenDayDu}</div>
              <div className="muted">
                {query.data.chuyenKhoa} • {query.data.tenCoSoYTe}
              </div>
            </div>
            <span className="chip">Hồ sơ: {query.data.trangThaiHoSo}</span>
          </div>

          <div className="row">
            <Link className="btn btn-primary" to="/doctor/requests">
              Duyệt yêu cầu đặt lịch
            </Link>
            <Link className="btn" to="/doctor/schedule">
              Cập nhật lịch làm việc
            </Link>
            <Link className="btn" to="/doctor/documents">
              Minh chứng
            </Link>
          </div>

          {query.data.trangThaiHoSo !== 'DA_DUYET' ? (
            <div className="card">
              <div className="title">Lưu ý</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Nếu hồ sơ đang <b>{query.data.trangThaiHoSo}</b>, theo UX bạn có thể bị hạn chế nhận/duyệt lịch hẹn.
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

