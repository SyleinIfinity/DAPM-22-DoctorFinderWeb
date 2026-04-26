import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AccountDoctorInfo } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function DoctorStatusPage() {
  const { session } = useAuth()
  const maTaiKhoan = session?.maTaiKhoan ?? null

  const query = useQuery({
    queryKey: ['doctor-status', maTaiKhoan],
    queryFn: async () => (await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`)).data,
    enabled: !!maTaiKhoan,
  })

  return (
    <>
      <PageHeader title="Trạng thái hồ sơ bác sĩ" right={<Link to="/app/account">Tài khoản</Link>} />

      {!maTaiKhoan ? <div className="card">Thiếu maTaiKhoan. Hãy đăng nhập lại.</div> : null}

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
              <div style={{ fontWeight: 900 }}>
                {query.data.hoLot} {query.data.ten}
              </div>
              <div className="muted">{query.data.email}</div>
            </div>
            <span className="chip">{query.data.trangThaiHoatDong}</span>
          </div>

          {query.data.coTaiKhoanBacSi ? (
            <div className="card stack">
              <div className="row-between">
                <div>
                  <div className="label">Hồ sơ bác sĩ</div>
                  <div style={{ fontWeight: 900 }}>
                    {query.data.chuyenKhoa || '—'} • {query.data.tenCoSoYTe || '—'}
                  </div>
                </div>
                <span className="chip">Trạng thái: {query.data.trangThaiHoSo || '—'}</span>
              </div>
              <div className="muted">
                Mã hồ sơ: {query.data.maBacSi ?? '—'} • Mã CCHN: {query.data.maChungChiHanhNghe || '—'}
              </div>
              <div className="row">
                <Link className="btn" to="/app/account">
                  Cập nhật hồ sơ
                </Link>
                {query.data.maBacSi ? (
                  <Link className="btn" to={`/app/doctors/${query.data.maBacSi}`}>
                    Xem hồ sơ công khai
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="card stack">
              <div className="title">Bạn chưa có hồ sơ bác sĩ</div>
              <div className="muted">
                Theo UX, bạn có thể mở hồ sơ bác sĩ ngay trong mục Tài khoản.
              </div>
              <Link className="btn btn-primary" to="/app/account">
                Mở hồ sơ bác sĩ
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </>
  )
}
