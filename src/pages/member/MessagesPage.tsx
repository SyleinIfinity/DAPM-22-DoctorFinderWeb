import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { ConversationSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

function formatConversationTime(value: string | null): string {
  if (!value) return 'Chưa cập nhật'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Vừa xong'

  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  return sameDay
    ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

export function MessagesPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const role = (session?.vaiTro || '').toUpperCase()
  const isDoctor = role === 'BAC_SI'
  const base = isDoctor ? '/doctor' : '/app'

  const maNguoiDung = session?.maNguoiDung ?? null
  const maBacSi = session?.maBacSi ?? null

  const params = isDoctor ? { maBacSi } : { maNguoiDung }
  const enabled = isDoctor ? !!maBacSi : !!maNguoiDung

  const query = useQuery({
    queryKey: ['conversations', isDoctor ? 'doctor' : 'user', isDoctor ? maBacSi : maNguoiDung],
    queryFn: async () => (await api.get<ConversationSummary[]>('/api/conversations', { params })).data,
    enabled,
  })

  const sorted = useMemo(() => {
    const list = query.data || []
    return [...list].sort((a, b) => {
      const ta = a.thoiGianGuiCuoi ? new Date(a.thoiGianGuiCuoi).getTime() : 0
      const tb = b.thoiGianGuiCuoi ? new Date(b.thoiGianGuiCuoi).getTime() : 0
      return tb - ta
    })
  }, [query.data])

  const latestConversation = sorted[0]

  return (
    <section className={`message-page ${isDoctor ? 'message-page--doctor' : 'message-page--member'}`}>
      <PageHeader title="Nhắn tin" />
      <p className="message-page__intro">
        {isDoctor
          ? 'Theo dõi các cuộc trao đổi với bệnh nhân và mở nhanh từng hội thoại.'
          : 'Xem lại các cuộc trò chuyện với bác sĩ và tiếp tục nhận tư vấn.'}
      </p>

      <div className="message-page__summary">
        <article className="message-summary-card">
          <span className="message-summary-card__label">Hội thoại</span>
          <strong className="message-summary-card__value">{sorted.length}</strong>
          <span className="message-summary-card__hint">
            {sorted.length === 1 ? '1 cuộc trò chuyện đang hoạt động' : `${sorted.length} cuộc trò chuyện đang hiển thị`}
          </span>
        </article>

        <article className="message-summary-card">
          <span className="message-summary-card__label">Vai trò</span>
          <strong className="message-summary-card__value">{isDoctor ? 'Bác sĩ' : 'Thành viên'}</strong>
          <span className="message-summary-card__hint">
            {isDoctor ? 'Tập trung vào trao đổi với bệnh nhân.' : 'Tập trung vào trao đổi với bác sĩ.'}
          </span>
        </article>

        <article className="message-summary-card">
          <span className="message-summary-card__label">Cập nhật gần nhất</span>
          <strong className="message-summary-card__value">{formatConversationTime(latestConversation?.thoiGianGuiCuoi ?? null)}</strong>
          <span className="message-summary-card__hint">
            {latestConversation?.noiDungCuoi || 'Chưa có tin nhắn nào được gửi.'}
          </span>
        </article>
      </div>

      {!enabled ? (
        <div className="message-notice message-notice--danger">Thiếu ID (maNguoiDung/maBacSi). Hãy đăng nhập lại.</div>
      ) : null}
      {query.isLoading ? <div className="message-notice">Đang tải danh sách hội thoại...</div> : null}
      {query.isError ? (
        <div className="message-notice message-notice--danger">{getApiErrorMessage(query.error)}</div>
      ) : null}

      {sorted.length === 0 && !query.isLoading ? (
        <div className="message-empty-state">
          <div className="message-empty-state__icon">...</div>
          <div className="message-empty-state__title">Chưa có hội thoại</div>
          <p className="message-empty-state__description">
            Các cuộc trò chuyện sẽ xuất hiện tại đây sau khi bắt đầu nhắn tin.
          </p>
        </div>
      ) : null}

      <div className="message-list">
        {sorted.map((c) => {
          const title = isDoctor ? c.hoTenBenhNhan : c.hoTenBacSi
          const subtitle = isDoctor ? 'Bệnh nhân' : `${c.chuyenKhoa} • ${c.tenCoSoYTe}`
          const avatarUrl = isDoctor ? c.anhDaiDienBenhNhan : c.anhDaiDienBacSi
          const lastMessage = c.noiDungCuoi || 'Chưa có tin nhắn'

          return (
            <article key={c.maCuocHoiThoai} className="message-thread-card">
              <div className="message-thread-card__main">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={title} className="message-thread-card__avatar message-thread-card__avatar--image" />
                ) : (
                  <div className="message-thread-card__avatar">{(title || '?').charAt(0).toUpperCase()}</div>
                )}

                <div className="message-thread-card__content">
                  <div className="message-thread-card__topline">
                    <div>
                      <div className="message-thread-card__title">{title}</div>
                      <div className="message-thread-card__subtitle">{subtitle}</div>
                    </div>
                    <div className="message-thread-card__time">{formatConversationTime(c.thoiGianGuiCuoi)}</div>
                  </div>

                  <div className="message-thread-card__preview">
                    <span className="message-thread-card__preview-label">Tin nhắn cuối</span>
                    <p className="message-thread-card__preview-text">{lastMessage}</p>
                  </div>
                </div>
              </div>

              <button
                className="message-thread-card__open"
                type="button"
                onClick={() => navigate(`${base}/messages/${c.maCuocHoiThoai}`)}
              >
                Mở
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
