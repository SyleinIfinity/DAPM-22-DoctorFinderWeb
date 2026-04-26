import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { PendingDoctorProfile } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function AdminPendingDoctorsPage() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['admin-pending-doctors'],
    queryFn: async () => (await api.get<PendingDoctorProfile[]>('/api/admin/doctors/pending')).data,
  })

  return (
    <>
      <PageHeader title="Duyệt hồ sơ bác sĩ" />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}

      <div className="stack">
        {(query.data || []).length === 0 ? <div className="muted">Không có hồ sơ chờ duyệt.</div> : null}
        {(query.data || []).map((d) => (
          <div key={d.maBacSi} className="card row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{d.hoTenDayDu}</div>
              <div className="muted">
                {d.chuyenKhoa} • CCHN: {d.maChungChiHanhNghe}
              </div>
              <div className="row">
                <span className="chip">Tài liệu: {d.soLuongTaiLieu}</span>
                <span className="chip">{d.trangThaiHoSo}</span>
              </div>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => navigate(`/admin/doctors/${d.maBacSi}`)}>
              Xem
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

