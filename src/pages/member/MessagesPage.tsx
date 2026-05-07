import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { api } from '../../api/http'
import type { ConversationSummary } from '../../api/types'
import { getApiErrorMessage } from '../../utils/errors'

function formatConversationTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

export function MessagesPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const isDoctor = session?.vaiTro?.toUpperCase() === 'BAC_SI'
  const base = isDoctor ? '/doctor' : '/app'

  const query = useQuery({
    queryKey: ['conversations', session?.maNguoiDung, session?.maBacSi, isDoctor ? 'doctor' : 'user'],
    queryFn: async () => {
      const params = isDoctor ? { maBacSi: session?.maBacSi } : { maNguoiDung: session?.maNguoiDung }
      return (await api.get<ConversationSummary[]>('/api/conversations', { params })).data
    },
  })

  const sorted = useMemo(() => (query.data || []), [query.data])

  return (
    <div className="member-page-shell">
      <PageHeader title="Tin nhắn" />
      {query.isError ? <div className="member-panel member-panel--error">{getApiErrorMessage(query.error)}</div> : null}
      <div className="member-panel">
        <div className="member-doctor-list">
          {sorted.map((c) => {
            const title = isDoctor ? c.hoTenBenhNhan : c.hoTenBacSi
            const lastMsg = c.noiDungCuoi || 'Bắt đầu cuộc trò chuyện'
            return (
              <article key={c.maCuocHoiThoai} className="member-doctor-card" onClick={() => navigate(`${base}/messages/${c.maCuocHoiThoai}`)}>
                <div className="member-doctor-card__avatar">{title.slice(0, 2).toUpperCase()}</div>
                <div className="member-doctor-card__body">
                  <h3>{title}</h3>
                  <p>{lastMsg}</p>
                  <p className="member-doctor-card__muted">{c.chuyenKhoa}</p>
                </div>
                <div className="member-doctor-card__cta">
                  <span className="member-link">{formatConversationTime(c.thoiGianGuiCuoi)}</span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
