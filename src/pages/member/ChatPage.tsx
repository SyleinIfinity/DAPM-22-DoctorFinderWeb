import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'

function normalizeTime(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function ChatPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  const maCuocHoiThoai = Number(params.maCuocHoiThoai)
  const maBacSiGiaLap = 1 // Giả định ID bác sĩ trong cuộc hội thoại này là 1
  const [noiDung, setNoiDung] = useState('')

  const { data } = useQuery({
    queryKey: ['messages', maCuocHoiThoai],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500))
      return [
        {
          maTinNhan: 1,
          maTaiKhoanGui: 999,
          noiDungTinNhan: "Chào bạn, tôi có thể giúp gì cho tình trạng sức khỏe của bạn hôm nay?",
          thoiGianGui: new Date(Date.now() - 300000).toISOString(),
        },
        {
          maTinNhan: 2,
          maTaiKhoanGui: session?.maTaiKhoan || 2,
          noiDungTinNhan: "Chào bác sĩ, dạo gần đây em hay bị đau đầu vào buổi sáng.",
          thoiGianGui: new Date(Date.now() - 200000).toISOString(),
        }
      ]
    },
    enabled: !!maCuocHoiThoai,
  })

  const messages = useMemo(() => data || [], [data])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: async () => {
      await new Promise(r => setTimeout(r, 300))
      return { noiDungTinNhan: noiDung }
    },
    onSuccess: () => setNoiDung(''),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', backgroundColor: '#F4F7F8' }}>
      
      {/* 1. HEADER - PGS.TS Nguyễn Anh */}
      <header style={{ 
        display: 'flex', alignItems: 'center', padding: '12px 20px', 
        backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', gap: '12px' 
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280' }}>←</button>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0d9488', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
            <img src="https://via.placeholder.com/100" alt="Dr" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid #fff' }}></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>PGS.TS Nguyễn Anh</div>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '500' }}>Đang online</div>
        </div>
        <div style={{ display: 'flex', gap: '18px', color: '#0d9488' }}>
          <span style={{ cursor: 'pointer' }}>📞</span>
          <span style={{ cursor: 'pointer' }}>⚙️</span>
        </div>
      </header>

      {/* 2. MESSAGES BODY */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 15px' }}>
        {messages.map((m) => {
          const isMine = m.maTaiKhoanGui === session?.maTaiKhoan || m.maTaiKhoanGui === 2
          
          return (
            <div key={m.maTinNhan} style={{ 
              display: 'flex', 
              flexDirection: isMine ? 'row-reverse' : 'row', 
              marginBottom: '24px', 
              gap: '12px',
              alignItems: 'flex-start' // Căn avatar lên đầu tin nhắn
            }}>
              {!isMine && (
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', 
                  backgroundColor: '#E5E7EB', overflow: 'hidden', flexShrink: 0,
                  marginTop: '4px' // Căn chỉnh để avatar không bị dính trần
                }}>
                   <img src="https://via.placeholder.com/50" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  padding: '12px 16px', 
                  borderRadius: isMine ? '18px 18px 0 18px' : '18px 18px 18px 0',
                  backgroundColor: isMine ? '#24D5DB' : '#fff',
                  color: isMine ? '#fff' : '#1F2937',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontWeight: '500'
                }}>
                  {m.noiDungTinNhan}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>
                  {normalizeTime(m.thoiGianGui)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. QUICK ACTIONS - CÓ GẮN LINK */}
      <div style={{ display: 'flex', gap: '10px', padding: '0 15px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button 
          onClick={() => navigate(`/app/doctors/${maBacSiGiaLap}/book`)}
          style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #CCFBF1', backgroundColor: '#F0FDFA', color: '#0d9488', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          📅 Đặt lịch
        </button>
        <button 
          onClick={() => navigate(`/app/doctors/${maBacSiGiaLap}`)}
          style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #CCFBF1', backgroundColor: '#F0FDFA', color: '#0d9488', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          👤 Xem hồ sơ bác sĩ
        </button>
        <button 
          style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #CCFBF1', backgroundColor: '#F0FDFA', color: '#0d9488', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          💰 Giá khám
        </button>
      </div>

      {/* 4. COMPOSER */}
      <footer style={{ padding: '12px 15px 30px', backgroundColor: '#fff', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: '24px', padding: '4px 8px 4px 16px', gap: '10px' }}>
          <input
            style={{ flex: 1, border: 'none', background: 'none', padding: '10px 0', outline: 'none', fontSize: '14px', color: '#374151' }}
            placeholder="Nhập tin nhắn..."
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sendMutation.isPending && sendMutation.mutate()}
          />
          <div style={{ display: 'flex', gap: '14px', color: '#9CA3AF', fontSize: '20px' }}>
            <span style={{ cursor: 'pointer' }}>🖼️</span>
            <span style={{ cursor: 'pointer' }}>📷</span>
          </div>
          <button 
            onClick={() => sendMutation.mutate()}
            disabled={!noiDung.trim() || sendMutation.isPending}
            style={{ 
              width: '38px', height: '38px', borderRadius: '50%', border: 'none', 
              backgroundColor: '#24D5DB', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            ➤
          </button>
        </div>
      </footer>
    </div>
  )
}