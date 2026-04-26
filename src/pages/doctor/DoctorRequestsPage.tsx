import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentRequest } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

function normalizeTime(value: string): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

export function DoctorRequestsPage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['appointment-requests', maBacSi],
    queryFn: async () => (await api.get<AppointmentRequest[]>(`/api/doctors/${maBacSi}/appointment-requests`)).data,
    enabled: !!maBacSi,
  })

  const approve = useMutation({
    mutationFn: async (maPhieuDatLich: number) => {
      await api.post(`/api/appointments/${maPhieuDatLich}/approve`)
    },
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['appointment-requests', maBacSi] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const reject = useMutation({
    mutationFn: async ({ maPhieuDatLich, lyDoTuChoi }: { maPhieuDatLich: number; lyDoTuChoi: string }) => {
      await api.post(`/api/appointments/${maPhieuDatLich}/reject`, { lyDoTuChoi })
    },
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['appointment-requests', maBacSi] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <>
      <PageHeader title="Yêu cầu đặt lịch" />

      {!maBacSi ? <div className="card">Thiếu maBacSi. Hãy đăng nhập lại.</div> : null}
      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}
      {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

      <div className="stack">
        {(query.data || []).length === 0 ? <div className="muted">Không có yêu cầu chờ xác nhận.</div> : null}
        {(query.data || []).map((r) => (
          <div key={r.maPhieuDatLich} className="card stack">
            <div className="row-between">
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 900 }}>{r.hoTenBenhNhan}</div>
                <div className="muted">
                  {r.ngayCuThe || '—'} • {normalizeTime(r.gioBatDau)}–{normalizeTime(r.gioKetThuc)}
                </div>
                {r.trieuChungGhiChu ? <div className="muted">Ghi chú: {r.trieuChungGhiChu}</div> : null}
              </div>
              <span className="chip">{r.trangThaiPhieu}</span>
            </div>

            <div className="row">
              <button className="btn btn-primary" type="button" disabled={approve.isPending} onClick={() => approve.mutate(r.maPhieuDatLich)}>
                Đồng ý
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={reject.isPending}
                onClick={() => {
                  const lyDo = prompt('Nhập lý do từ chối:', 'Bận / không phù hợp')
                  if (!lyDo) return
                  reject.mutate({ maPhieuDatLich: r.maPhieuDatLich, lyDoTuChoi: lyDo })
                }}
              >
                Từ chối
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

