import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminDoctorAction, AdminDoctorDetail } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function AdminDoctorDetailPage() {
  const params = useParams()
  const qc = useQueryClient()
  const maBacSi = Number(params.maBacSi)

  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin-doctor-detail', maBacSi],
    queryFn: async () => (await api.get<AdminDoctorDetail>(`/api/admin/doctors/${maBacSi}`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  })

  const approve = useMutation({
    mutationFn: async () => (await api.post<AdminDoctorAction>(`/api/admin/doctors/${maBacSi}/approve`)).data,
    onSuccess: async (data) => {
      alert(data.message || 'Thành công')
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-doctor-detail', maBacSi] })
      await qc.invalidateQueries({ queryKey: ['admin-pending-doctors'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const reject = useMutation({
    mutationFn: async (lyDoTuChoi: string) =>
      (await api.post<AdminDoctorAction>(`/api/admin/doctors/${maBacSi}/reject`, { lyDoTuChoi })).data,
    onSuccess: async (data) => {
      alert(data.message || 'Thành công')
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-doctor-detail', maBacSi] })
      await qc.invalidateQueries({ queryKey: ['admin-pending-doctors'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <>
        <PageHeader title="Chi tiết hồ sơ" />
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Chi tiết hồ sơ" right={<Link to="/admin/pending-doctors">Danh sách</Link>} />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}
      {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

      {query.data ? (
        <div className="card stack">
          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{query.data.hoTenDayDu}</div>
              <div className="muted">
                {query.data.chuyenKhoa} • {query.data.trinhDoChuyenMon}
              </div>
              <div className="muted">{query.data.tenCoSoYTe}</div>
              <div className="muted">{query.data.diaChiLamViec || '—'}</div>
            </div>
            <span className="chip">{query.data.trangThaiHoSo}</span>
          </div>

          <div className="row">
            <button className="btn btn-primary" type="button" disabled={approve.isPending} onClick={() => approve.mutate()}>
              Phê duyệt
            </button>
            <button
              className="btn btn-danger"
              type="button"
              disabled={reject.isPending}
              onClick={() => {
                const reason = prompt('Lý do từ chối:', 'Thiếu minh chứng')
                if (!reason) return
                reject.mutate(reason)
              }}
            >
              Từ chối
            </button>
          </div>

          <div className="card stack">
            <div className="title">Minh chứng</div>
            {query.data.documents.length === 0 ? <div className="muted">Không có tài liệu.</div> : null}
            {query.data.documents.map((doc) => (
              <div key={doc.maTaiLieu} className="row-between card">
                <div className="stack" style={{ gap: 4 }}>
                  <div style={{ fontWeight: 900 }}>{doc.tieuDeTaiLieu}</div>
                  <a className="muted" href={doc.duongDanFileUrl} target="_blank" rel="noreferrer">
                    Mở file
                  </a>
                </div>
                <span className="chip">#{doc.maTaiLieu}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

