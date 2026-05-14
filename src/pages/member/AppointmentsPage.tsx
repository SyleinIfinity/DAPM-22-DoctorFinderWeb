import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { api } from '../../api/http'
import { getApiErrorMessage } from '../../utils/errors'

type TabKey = 'pending' | 'waiting' | 'done' | 'review' | 'history'

function normalizeTime(value: string | null): string {
  if (!value) return '--:--'
  return value.slice(0, 5)
}

function getStatusStyles(status: string | null) {
  switch (status) {
    case 'CHO_XAC_NHAN': return { color: '#FAAD14', bg: '#FFFBE6', border: '#FFE58F', label: 'Chờ xác nhận' }
    case 'DA_XAC_NHAN': return { color: '#13C2C2', bg: '#E6FFFB', border: '#87E8DE', label: 'Chờ khám' }
    case 'DA_KHAM': return { color: '#52C41A', bg: '#F6FFED', border: '#B7EB8F', label: 'Đã khám' }
    case 'DA_HUY': return { color: '#8C8C8C', bg: '#F5F5F5', border: '#D9D9D9', label: 'Đã hủy' }
    case 'TU_CHOI': return { color: '#FF4D4F', bg: '#FFF1F0', border: '#FFA39E', label: 'Đã từ chối' }
    default: return { color: '#8C8C8C', bg: '#F5F5F5', border: '#D9D9D9', label: 'Không xác định' }
  }
}

function getTabLabel(tab: TabKey) {
  switch (tab) {
    case 'pending': return 'Chờ xác nhận'
    case 'waiting': return 'Chờ khám'
    case 'done': return 'Đã khám'
    case 'review': return 'Đánh giá'
    case 'history': return 'Lịch sử'
  }
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null
  const [tab, setTab] = useState<TabKey>('pending')
  const [showCreate, setShowCreate] = useState(false)

  const query = useQuery({
    queryKey: ['appointments', maNguoiDung],
    queryFn: async () => {
      if (!maNguoiDung) return [] as AppointmentSummary[]
      return (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'HISTORY' } })).data
    },
    enabled: !!maNguoiDung,
  })

  const list = useMemo(() => query.data || [], [query.data])

  const filteredList = useMemo(() => {
    return list.filter((a) => {
      if (tab === 'pending') return a.trangThaiPhieu === 'CHO_XAC_NHAN'
      if (tab === 'waiting') return a.trangThaiPhieu === 'DA_XAC_NHAN'
      if (tab === 'done') return a.trangThaiPhieu === 'DA_KHAM'
      if (tab === 'review') return a.trangThaiPhieu === 'DA_KHAM' && a.coTheDanhGia
      if (tab === 'history') return a.trangThaiPhieu !== 'CHO_XAC_NHAN'
      return true
    })
  }, [list, tab])

  const reviewTarget = useMemo(() => {
    if (tab !== 'review') return null
    return filteredList.find((a) => a.coTheDanhGia) ?? null
  }, [filteredList, tab])

  return (
    <div className="member-page-shell">
      <PageHeader 
        title="Lịch hẹn của tôi" 
        right={<button onClick={() => setShowCreate(true)} className="member-fab" type="button">+</button>} 
      />

      <div className="member-panel">
        <div className="member-tabs">
          {(Object.keys({ pending: true, waiting: true, done: true, review: true, history: true }) as TabKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={tab === key ? 'member-tab member-tab--active' : 'member-tab'}
              type="button"
            >
              {getTabLabel(key)}
            </button>
          ))}
        </div>

        {query.isError ? <div className="member-empty-state member-empty-state--error">{getApiErrorMessage(query.error)}</div> : null}
        {query.isLoading ? <div className="member-empty-state">Đang tải lịch hẹn...</div> : null}
        {!query.isLoading && filteredList.length === 0 ? <div className="member-empty-state">Chưa có lịch hẹn nào trong tab này.</div> : null}

        {tab === 'review' && reviewTarget ? (
          <div className="member-review-banner" style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Bác sĩ {reviewTarget.hoTenBacSi}</div>
                <div style={{ color: '#64748b' }}>{reviewTarget.chuyenKhoa} • {reviewTarget.tenCoSoYTe}</div>
              </div>
              <button
                type="button"
                className="member-tab member-tab--active"
                onClick={() => navigate(`/app/doctors/${reviewTarget.maBacSi}`)}
                style={{ cursor: 'pointer' }}
              >
                Viết đánh giá
              </button>
            </div>
          </div>
        ) : null}

        <div className="member-appointment-list">
          {filteredList.map((a) => {
            const status = getStatusStyles(a.trangThaiPhieu)
            const dateParts = (a.ngayCuThe || '----/--/--').split('-')
            const canGoToReview = tab === 'review' && a.coTheDanhGia
            return (
              <article
                key={a.maPhieuDatLich}
                className="member-appointment-card"
                onClick={() => navigate(`/app/appointments/${a.maPhieuDatLich}`)}
                role="button"
                tabIndex={0}
              >
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
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {canGoToReview ? (
                      <button
                        type="button"
                        className="member-link"
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/app/doctors/${a.maBacSi}`)
                        }}
                      >
                        Đi tới đánh giá ›
                      </button>
                    ) : null}
                    <span className="member-link">Xem chi tiết ›</span>
                  </div>
                </div>
              </article>
            )
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
