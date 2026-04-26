import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { DoctorProfile } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function SuggestedDoctorsPage() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['suggested-doctors'],
    queryFn: async () =>
      (
        await api.get<DoctorProfile[]>('/api/doctors/search', {
          params: {
            trangThaiHoSo: 'DA_DUYET',
            limit: 12,
            offset: 0,
          },
        })
      ).data,
  })

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <>
      <PageHeader title="Bác sĩ gợi ý" right={<Link to="/app/home">Trang chủ</Link>} />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}

      {list.length === 0 ? <div className="muted">Chưa có gợi ý.</div> : null}

      <div className="stack">
        {list.map((d) => (
          <div key={d.maBacSi} className="card row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{d.hoTenDayDu}</div>
              <div className="muted">
                {d.chuyenKhoa} • {d.tenCoSoYTe}
              </div>
              <div className="muted">{d.diaChiLamViec || '—'}</div>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}>
              Xem
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
