import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { api } from '../../api/http'
import { getApiErrorMessage } from '../../utils/errors'

type Scope = 'upcoming' | 'history'

function normalizeTime(value: string | null): string {
  if (!value) return '--:--'
  return value.slice(0, 5)
}

function getStatusStyles(status: string | null) {
  switch (status) {
    case 'CHO_XAC_NHAN': return { color: '#FAAD14', bg: '#FFFBE6', border: '#FFE58F', label: 'Chờ xác nhận' }
    case 'DA_XAC_NHAN': return { color: '#13C2C2', bg: '#E6FFFB', border: '#87E8DE', label: 'Đã xác nhận' }
    case 'DA_KHAM': return { color: '#52C41A', bg: '#F6FFED', border: '#B7EB8F', label: 'Đã khám' }
    case 'DA_HUY': return { color: '#8C8C8C', bg: '#F5F5F5', border: '#D9D9D9', label: 'Đã hủy' }
    case 'TU_CHOI': return { color: '#FF4D4F', bg: '#FFF1F0', border: '#FFA39E', label: 'Đã từ chối' }
    default: return { color: '#8C8C8C', bg: '#F5F5F5', border: '#D9D9D9', label: 'Không xác định' }
  }
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null
  const [scope, setScope] = useState<Scope>('upcoming')
  const [showCreate, setShowCreate] = useState(false)

  const query = useQuery({
    queryKey: ['appointments', maNguoiDung, scope],
    queryFn: async () => {
      if (!maNguoiDung) return [] as AppointmentSummary[]
      const actualScope = scope === 'upcoming' ? 'UPCOMING' : 'HISTORY'
      return (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: actualScope } })).data
    },
    enabled: !!maNguoiDung,
  })

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <div className="member-page-shell">
      <PageHeader 
        title="Lịch hẹn của tôi" 
        right={<button onClick={() => setShowCreate(true)} className="member-fab" type="button">+</button>} 
      />

      <div className="member-panel">
        <div className="member-tabs">
          <button onClick={() => setScope('upcoming')} className={scope === 'upcoming' ? 'member-tab member-tab--active' : 'member-tab'}>Sắp tới</button>
          <button onClick={() => setScope('history')} className={scope === 'history' ? 'member-tab member-tab--active' : 'member-tab'}>Lịch sử</button>
        </div>

        {query.isError ? <div className="member-empty-state member-empty-state--error">{getApiErrorMessage(query.error)}</div> : null}
        {query.isLoading ? <div className="member-empty-state">Đang tải lịch hẹn...</div> : null}
        {!query.isLoading && list.length === 0 ? <div className="member-empty-state">Chưa có lịch hẹn nào.</div> : null}

        <div className="member-appointment-list">
          {list.map((a) => {
            const status = getStatusStyles(a.trangThaiPhieu);
            const dateParts = (a.ngayCuThe || '----/--/--').split('-'); 
            return (
              <article key={a.maPhieuDatLich} className="member-appointment-card" onClick={() => navigate(`/app/appointments/${a.maPhieuDatLich}`)}>
                <div className="member-date-box">
                  <span>THG {dateParts[1]}</span>
                  <strong>{dateParts[2]}</strong>
                </div>
                <div className="member-appointment-card__content">
                  <strong>{a.hoTenBacSi}</strong>
                  <span>⏰ {normalizeTime(a.gioBatDau)} - {normalizeTime(a.gioKetThuc)}</span>
                </div>
                <div className="member-appointment-card__footer">
                  <span className="member-status-pill" style={{ color: status.color, backgroundColor: status.bg, borderColor: status.border }}>{status.label}</span>
                  <span className="member-link">Xem chi tiết ›</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <div className="member-modal" onClick={() => setShowCreate(false)}>
          <div className="member-modal__panel" onClick={e => e.stopPropagation()}>
            <h3>Đặt lịch mới</h3>
            <div className="member-modal__actions">
              <button onClick={() => navigate('/app/search')} className="btn btn-primary" type="button">🔍 Tìm bác sĩ chuyên khoa</button>
              <button onClick={() => navigate('/app/appointments/new/known')} className="btn btn-outline" type="button">👤 Bác sĩ đã từng khám</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
