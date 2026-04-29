import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'

function formatConversationTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.getDate() === now.getDate() && date.getMonth() === now.getMonth()
  
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
    queryKey: ['conversations', isDoctor ? 'doctor' : 'user'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500))
      // DANH SÁCH DÀI HƠN & ĐÃ FIX LỖI THIẾU hoTenBenhNhan
      return [
        {
          maCuocHoiThoai: 101,
          hoTenBacSi: "BS. Nguyễn Anh",
          hoTenBenhNhan: "Trần Minh Nhân",
          chuyenKhoa: "Thần kinh",
          noiDungCuoi: "Bạn có thể đặt lịch vào ngày mai để tôi kiểm tra kỹ hơn nhé.",
          thoiGianGuiCuoi: new Date().toISOString(),
          unreadCount: 2,
          isOnline: true
        },
        {
          maCuocHoiThoai: 102,
          hoTenBacSi: "BS. Lê Tuyết",
          hoTenBenhNhan: "Nguyễn Văn A",
          chuyenKhoa: "Nhi khoa",
          noiDungCuoi: "Bé đã đỡ sốt chưa chị ơi?",
          thoiGianGuiCuoi: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 0,
          isOnline: false
        },
        {
          maCuocHoiThoai: 103,
          hoTenBacSi: "BS. Phạm Hòa",
          hoTenBenhNhan: "Lê Thị B",
          chuyenKhoa: "Tim mạch",
          noiDungCuoi: "Nhớ uống thuốc đúng giờ và hạn chế ăn mặn.",
          thoiGianGuiCuoi: new Date(Date.now() - 86400000).toISOString(),
          unreadCount: 1,
          isOnline: true
        },
        {
          maCuocHoiThoai: 104,
          hoTenBacSi: "BS. Đỗ Hùng",
          hoTenBenhNhan: "Hoàng Nam",
          chuyenKhoa: "Xương khớp",
          noiDungCuoi: "Kết quả chụp X-quang của anh không có gì đáng lo.",
          thoiGianGuiCuoi: new Date(Date.now() - 172800000).toISOString(),
          unreadCount: 0,
          isOnline: false
        },
        {
          maCuocHoiThoai: 105,
          hoTenBacSi: "BS. Mai Phương",
          hoTenBenhNhan: "Quỳnh Chi",
          chuyenKhoa: "Da liễu",
          noiDungCuoi: "Chụp giúp tôi vùng da bị dị ứng hiện tại.",
          thoiGianGuiCuoi: new Date(Date.now() - 259200000).toISOString(),
          unreadCount: 5,
          isOnline: true
        }
      ]
    }
  })

  const sorted = useMemo(() => (query.data || []), [query.data])

  return (
    <div style={{ backgroundColor: '#F4F7F8', minHeight: '100vh', paddingBottom: '40px' }}>
      <PageHeader title="Tin nhắn" />

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '10px 15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sorted.map((c) => {
            // FIX: TypeScript sẽ không còn báo lỗi ở đây nữa
            const title = isDoctor ? c.hoTenBenhNhan : c.hoTenBacSi
            const lastMsg = c.noiDungCuoi || 'Bắt đầu cuộc trò chuyện'

            return (
              <div 
                key={c.maCuocHoiThoai}
                onClick={() => navigate(`${base}/messages/${c.maCuocHoiThoai}`)}
                className="message-item-card" // Chúng ta dùng style inline nhưng có thể giả lập hover
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ 
                    width: '52px', height: '52px', borderRadius: '50%', 
                    backgroundColor: '#e5e7eb', overflow: 'hidden'
                  }}>
                    <img 
                      src={`https://i.pravatar.cc/150?u=${c.maCuocHoiThoai}`} // Dùng ảnh ngẫu nhiên cho thật
                      alt="avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  {c.isOnline && (
                    <div style={{
                      position: 'absolute', bottom: '1px', right: '1px',
                      width: '13px', height: '13px', backgroundColor: '#22C55E',
                      borderRadius: '50%', border: '2px solid #fff'
                    }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, marginLeft: '16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1A1A1A' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {formatConversationTime(c.thoiGianGuiCuoi)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ 
                      margin: 0, fontSize: '13px', color: '#6B7280', 
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      flex: 1
                    }}>
                      {lastMsg}
                    </p>
                    
                    {c.unreadCount > 0 && (
                      <div style={{
                        backgroundColor: '#24D5DB', color: '#fff', fontSize: '11px',
                        fontWeight: 'bold', minWidth: '20px', height: '20px',
                        borderRadius: '10px', display: 'grid', placeItems: 'center',
                        marginLeft: '10px', padding: '0 6px'
                      }}>
                        {c.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}