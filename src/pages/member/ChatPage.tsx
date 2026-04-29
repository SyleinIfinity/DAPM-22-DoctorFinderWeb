import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { api } from '../../api/http'
// import type { Message } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
// import { getApiErrorMessage } from '../../utils/errors'

function normalizeTime(value: string): string {
  if (!value) return ''

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
  }

  const parts = value.split('T')
  if (parts.length !== 2) return value
  return parts[1].slice(0, 5)
}

export function ChatPage() {
  const params = useParams()
  const qc = useQueryClient()
  const { session } = useAuth()

  const role = (session?.vaiTro || '').toUpperCase()
  const isDoctor = role === 'BAC_SI'
  const base = isDoctor ? '/doctor' : '/app'

  const maCuocHoiThoai = Number(params.maCuocHoiThoai)
  const [noiDung, setNoiDung] = useState('')
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['messages', maCuocHoiThoai],
    queryFn: async () => {
      // --- COMMAND API THẬT ---
      /*
      return (await api.get<Message[]>(`/api/conversations/${maCuocHoiThoai}/messages`, { params: { limit: 80 } })).data
      */

      // --- MOCK DATA GIẢ LẬP ---
      await new Promise(r => setTimeout(r, 500));
      return [
        {
          maTinNhan: 1,
          maTaiKhoanGui: 999, // Giả lập ID Bác sĩ
          noiDungTinNhan: "Chào bạn, tôi là bác sĩ Nhân. Bạn đang gặp vấn đề gì về sức khỏe?",
          thoiGianGui: new Date(Date.now() - 300000).toISOString(),
          loaiNoiDung: 'TEXT'
        },
        {
          maTinNhan: 2,
          maTaiKhoanGui: session?.maTaiKhoan || 1, // Giả lập ID của bạn
          noiDungTinNhan: "Chào bác sĩ, dạo gần đây em hay bị đau đầu vào buổi sáng.",
          thoiGianGui: new Date(Date.now() - 200000).toISOString(),
          loaiNoiDung: 'TEXT'
        },
        {
          maTinNhan: 3,
          maTaiKhoanGui: 999,
          noiDungTinNhan: "Tình trạng này diễn ra bao lâu rồi? Bạn có bị mất ngủ không?",
          thoiGianGui: new Date().toISOString(),
          loaiNoiDung: 'TEXT'
        }
      ];
    },
    enabled: Number.isFinite(maCuocHoiThoai) && maCuocHoiThoai > 0,
    refetchInterval: 5000,
  })

  const messages = useMemo(() => {
    const list = query.data || []
    return [...list].sort((a, b) => (a.thoiGianGui || '').localeCompare(b.thoiGianGui || ''))
  }, [query.data])

  const sendMutation = useMutation({
    mutationFn: async () => {
      // --- COMMAND API THẬT ---
      /*
      if (!session?.maTaiKhoan) throw new Error('Thiếu maTaiKhoan')
      const text = noiDung.trim()
      if (!text) throw new Error('Vui lòng nhập nội dung')
      const res = await api.post<Message>(`/api/conversations/${maCuocHoiThoai}/messages`, {
        maTaiKhoanGui: session.maTaiKhoan,
        noiDungTinNhan: text,
        loaiNoiDung: 'TEXT',
      })
      return res.data
      */

      // --- GIẢ LẬP GỬI TIN NHẮN THÀNH CÔNG ---
      await new Promise(r => setTimeout(r, 300));
      console.log("Tin nhắn đã gửi:", noiDung);
      return {}; 
    },
    onSuccess: async () => {
      setNoiDung('')
      // Tạm thời comment vì đang dùng mock data tĩnh
      // await qc.invalidateQueries({ queryKey: ['messages', maCuocHoiThoai] })
    },
    // onError: (err) => setError(getApiErrorMessage(err)),
  })

  useEffect(() => {
    setError(null)
  }, [maCuocHoiThoai])

  useEffect(() => {
    if (error && noiDung.trim()) setError(null)
  }, [noiDung, error])

  if (!Number.isFinite(maCuocHoiThoai) || maCuocHoiThoai <= 0) {
    return (
      <section className={`message-page ${isDoctor ? 'message-page--doctor' : 'message-page--member'}`}>
        <PageHeader title="Chat" />
        <div className="message-notice message-notice--danger">URL không hợp lệ.</div>
      </section>
    )
  }

  return (
    <section className={`message-page ${isDoctor ? 'message-page--doctor' : 'message-page--member'}`}>
      <PageHeader title="Chat" right={<Link className="message-page__link" to={`${base}/messages`}>Danh sách</Link>} />
      
      <div className="chat-shell">
        <div className="chat-shell__messages">
          {messages.length === 0 && !query.isLoading ? (
            <div className="message-empty-state message-empty-state--compact">
              <div className="message-empty-state__icon">...</div>
              <div className="message-empty-state__title">Chưa có tin nhắn</div>
              <p className="message-empty-state__description">Hãy gửi lời nhắn đầu tiên để bắt đầu cuộc trò chuyện.</p>
            </div>
          ) : null}

          {messages.map((m) => {
            const mine = m.maTaiKhoanGui === session?.maTaiKhoan || m.maTaiKhoanGui === 1 // logic giả lập mine

            return (
              <div key={m.maTinNhan} className={`chat-row ${mine ? 'chat-row--mine' : ''}`}>
                <article className={`chat-bubble ${mine ? 'chat-bubble--mine' : ''}`}>
                  <div className="chat-bubble__meta">
                    <span className="chat-bubble__author">{mine ? 'Bạn' : `Bác sĩ (${m.maTaiKhoanGui})`}</span>
                    <span className="chat-bubble__time">{normalizeTime(m.thoiGianGui)}</span>
                  </div>
                  <div className="chat-bubble__content">{m.noiDungTinNhan}</div>
                </article>
              </div>
            )
          })}
        </div>

        {error ? <div className="message-notice message-notice--danger">{error}</div> : null}

        <div className="chat-composer">
          <input
            className="chat-composer__input"
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            placeholder="Nhập tin nhắn..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !sendMutation.isPending) sendMutation.mutate();
            }}
          />
          <button
            className="message-thread-card__open chat-composer__send"
            type="button"
            disabled={sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? '...' : 'Gửi'}
          </button>
        </div>
      </div>
    </section>
  )
}