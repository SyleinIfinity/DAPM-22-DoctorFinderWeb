import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../api/http'
import type { ConversationSummary, Message } from '../../api/types'
import { getApiErrorMessage } from '../../utils/errors'

function normalizeTime(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function ChatPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const qc = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const maCuocHoiThoai = Number(params.maCuocHoiThoai)
  const [noiDung, setNoiDung] = useState('')

  const conversationQuery = useQuery({
    queryKey: ['conversation', maCuocHoiThoai, session?.maNguoiDung, session?.maBacSi],
    queryFn: async () => {
      const conversations = (await api.get<ConversationSummary[]>('/api/conversations', {
        params: session?.vaiTro?.toUpperCase() === 'BAC_SI'
          ? { maBacSi: session?.maBacSi }
          : { maNguoiDung: session?.maNguoiDung },
      })).data
      return conversations.find((item) => item.maCuocHoiThoai === maCuocHoiThoai) || conversations[0] || null
    },
    enabled: Number.isFinite(maCuocHoiThoai) && maCuocHoiThoai > 0,
  })

  const messagesQuery = useQuery({
    queryKey: ['messages', maCuocHoiThoai],
    queryFn: async () => (await api.get<Message[]>(`/api/conversations/${maCuocHoiThoai}/messages`, { params: { limit: 100 } })).data,
    enabled: Number.isFinite(maCuocHoiThoai) && maCuocHoiThoai > 0,
  })

  const messages = useMemo(() => messagesQuery.data || [], [messagesQuery.data])
  const isMine = (m: Message) => m.maTaiKhoanGui === session?.maTaiKhoan

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        maTaiKhoanGui: session?.maTaiKhoan,
        noiDungTinNhan: noiDung.trim(),
        loaiNoiDung: 'TEXT',
      }
      return (await api.post(`/api/conversations/${maCuocHoiThoai}/messages`, payload)).data
    },
    onSuccess: async () => {
      setNoiDung('')
      await qc.invalidateQueries({ queryKey: ['messages', maCuocHoiThoai] })
      await qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const conversation = conversationQuery.data
  const headerName = conversation ? (session?.vaiTro?.toUpperCase() === 'BAC_SI' ? conversation.hoTenBenhNhan : conversation.hoTenBacSi) : 'Cuộc trò chuyện'

  return (
    <div className="member-chat-shell">
      <header className="member-chat-header">
        <button onClick={() => navigate(-1)} className="member-chat-header__back" type="button">←</button>
        <div className="member-chat-header__avatar">{headerName.slice(0, 2).toUpperCase()}</div>
        <div className="member-chat-header__info">
          <div className="member-chat-header__name">{headerName}</div>
          <div className="member-chat-header__meta">{conversation?.chuyenKhoa || 'Đang hoạt động'}</div>
        </div>
        <button className="member-chat-header__ghost" type="button" onClick={() => navigate(conversation ? `/app/doctors/${conversation.maBacSi}` : '/app/home')}>Hồ sơ</button>
      </header>

      <div ref={scrollRef} className="member-chat-body">
        {messagesQuery.isError ? <div className="member-empty-state member-empty-state--error">{getApiErrorMessage(messagesQuery.error)}</div> : null}
        {messages.map((m) => (
          <div key={m.maTinNhan} className={isMine(m) ? 'member-chat-row member-chat-row--mine' : 'member-chat-row'}>
            <div className={isMine(m) ? 'member-chat-bubble member-chat-bubble--mine' : 'member-chat-bubble'}>
              {m.noiDungTinNhan}
            </div>
            <div className="member-chat-time">{normalizeTime(m.thoiGianGui)}</div>
          </div>
        ))}
        {messagesQuery.isLoading ? <div className="member-empty-state">Đang tải tin nhắn...</div> : null}
      </div>

      <div className="member-chat-actions">
        <button type="button" className="btn btn-outline" onClick={() => navigate(conversation ? `/app/doctors/${conversation.maBacSi}/slots` : '/app/home')}>Đặt lịch</button>
        <button type="button" className="btn btn-outline" onClick={() => navigate(conversation ? `/app/doctors/${conversation.maBacSi}` : '/app/home')}>Hồ sơ</button>
      </div>

      <footer className="member-chat-composer">
        <input
          className="member-input"
          placeholder="Nhập tin nhắn..."
          value={noiDung}
          onChange={(e) => setNoiDung(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !sendMutation.isPending && sendMutation.mutate()}
        />
        <button
          onClick={() => sendMutation.mutate()}
          disabled={!noiDung.trim() || sendMutation.isPending}
          className="btn btn-primary"
          type="button"
        >
          Gửi
        </button>
      </footer>
    </div>
  )
}
