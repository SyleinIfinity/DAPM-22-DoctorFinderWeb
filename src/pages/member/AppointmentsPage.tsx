import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

type Scope = 'upcoming' | 'history'

function normalizeTime(value: string): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null

  const [scope, setScope] = useState<Scope>('upcoming')
  const [showCreate, setShowCreate] = useState(false)

  const query = useQuery({
    queryKey: ['appointments', maNguoiDung, scope],
    queryFn: async () =>
      (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope } })).data,
    enabled: !!maNguoiDung,
  })

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <>
      <PageHeader
        title="Đặt lịch"
        right={
          <button className="btn btn-primary" type="button" onClick={() => setShowCreate(true)}>
            +
          </button>
        }
      />

      <div className="card stack">
        <div className="tabs">
          <button
            className={scope === 'upcoming' ? 'tab tab-active' : 'tab'}
            type="button"
            onClick={() => setScope('upcoming')}
          >
            Sắp tới
          </button>
          <button
            className={scope === 'history' ? 'tab tab-active' : 'tab'}
            type="button"
            onClick={() => setScope('history')}
          >
            Lịch sử
          </button>
        </div>

        {!maNguoiDung ? <div className="muted">Thiếu maNguoiDung. Hãy đăng nhập lại.</div> : null}
        {query.isLoading ? <div className="muted">Đang tải…</div> : null}
        {query.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(query.error)}
          </div>
        ) : null}
      </div>

      <div style={{ height: 12 }} />

      {list.length === 0 ? <div className="muted">Chưa có phiếu đặt lịch.</div> : null}
      <div className="stack">
        {list.map((a) => (
          <div key={a.maPhieuDatLich} className="card row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{a.hoTenBacSi}</div>
              <div className="muted">
                {a.ngayCuThe || '—'} • {normalizeTime(a.gioBatDau)}–{normalizeTime(a.gioKetThuc)}
              </div>
              <div className="row">
                <span className="chip">{a.trangThaiPhieu}</span>
                {a.lyDoTuChoi ? <span className="chip">Lý do: {a.lyDoTuChoi}</span> : null}
              </div>
            </div>
            <button className="btn" type="button" onClick={() => navigate(`/app/appointments/${a.maPhieuDatLich}`)}>
              Chi tiết
            </button>
          </div>
        ))}
      </div>

      {showCreate ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCreate(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'grid',
            placeItems: 'center',
            padding: 12,
            zIndex: 50,
          }}
        >
          <div
            className="card stack"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(520px, 100%)' }}
          >
            <div className="title">Tạo phiếu mới</div>
            <div className="muted">Chọn bác sĩ gần nhất theo luồng UX.</div>
            <div className="row">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  navigate('/app/home')
                }}
              >
                Bác sĩ mới
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  navigate('/app/appointments/new/known')
                }}
              >
                Bác sĩ đã biết
              </button>
              <button className="btn" type="button" onClick={() => setShowCreate(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

