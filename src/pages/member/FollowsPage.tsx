import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function FollowsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null
  
  // Tab 'FOLLOWED' là đã theo dõi, 'RECENT' là vừa xem
  const [activeTab, setActiveTab] = useState<'FOLLOWED' | 'RECENT'>('FOLLOWED')

  // 1. Query lấy danh sách Bác sĩ Đã theo dõi
  const followedQuery = useQuery({
    queryKey: ['follows', maNguoiDung],
    queryFn: async () => {
      // Giả lập lấy từ API /api/follows
      await new Promise(resolve => setTimeout(resolve, 400));
      return [
        {
          maBacSi: 1,
          hoTenBacSi: "PGS.TS Nguyễn Anh",
          chuyenKhoa: "Thần kinh",
          rating: 4.9,
          reviews: 120,
          exp: 15,
          distance: "1.2 km",
          hasSlot: true
        }
      ];
    },
    enabled: activeTab === 'FOLLOWED',
  })

  // 2. Query lấy danh sách Bác sĩ Vừa xem (Lấy dữ liệu giống trang chủ)
  const recentQuery = useQuery({
    queryKey: ['recent-doctors', maNguoiDung],
    queryFn: async () => {
      // Giả lập lấy từ API /api/doctors/recent
      await new Promise(resolve => setTimeout(resolve, 400));
      return [
        {
          maBacSi: 3,
          hoTenBacSi: "BS. Trần Văn Mạnh",
          chuyenKhoa: "Da liễu",
          rating: 4.7,
          reviews: 45,
          exp: 8,
          distance: "3.5 km",
          hasSlot: true
        },
        {
          maBacSi: 1, // Bác sĩ này vừa theo dõi vừa xem gần đây
          hoTenBacSi: "PGS.TS Nguyễn Anh",
          chuyenKhoa: "Thần kinh",
          rating: 4.9,
          reviews: 120,
          exp: 15,
          distance: "1.2 km",
          hasSlot: true
        }
      ];
    },
    enabled: activeTab === 'RECENT',
  })

  const unfollow = useMutation({
    mutationFn: async (maBacSi: number) => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      await api.delete(`/api/follows/${maBacSi}`, { params: { maNguoiDung } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follows', maNguoiDung] })
    },
  })

  // Xác định dữ liệu nào sẽ được hiển thị dựa trên Tab
  const currentData = activeTab === 'FOLLOWED' ? followedQuery.data : recentQuery.data
  const isLoading = activeTab === 'FOLLOWED' ? followedQuery.isLoading : recentQuery.isLoading

  return (
    <div style={{ backgroundColor: '#F4F7F8', minHeight: '100vh', paddingBottom: '40px' }}>
      <PageHeader title="Bác sĩ của bạn" />

      <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '10px 20px' }}>
        
        {/* Tìm kiếm */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#AAA' }}>🔍</span>
          <input 
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '25px', border: 'none', backgroundColor: '#fff', fontSize: '14px', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            placeholder={activeTab === 'FOLLOWED' ? "Tìm trong danh sách theo dõi..." : "Tìm trong bác sĩ vừa xem..."}
          />
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '20px', position: 'sticky', top: 0, backgroundColor: '#F4F7F8', zIndex: 10 }}>
          <button 
            onClick={() => setActiveTab('FOLLOWED')}
            style={{ flex: 1, padding: '15px', border: 'none', background: 'none', fontWeight: '800', fontSize: '15px', color: activeTab === 'FOLLOWED' ? '#24D5DB' : '#9CA3AF', borderBottom: activeTab === 'FOLLOWED' ? '3px solid #24D5DB' : 'none', cursor: 'pointer', transition: '0.3s' }}
          >
            Đã theo dõi
          </button>
          <button 
            onClick={() => setActiveTab('RECENT')}
            style={{ flex: 1, padding: '15px', border: 'none', background: 'none', fontWeight: '800', fontSize: '15px', color: activeTab === 'RECENT' ? '#24D5DB' : '#9CA3AF', borderBottom: activeTab === 'RECENT' ? '3px solid #24D5DB' : 'none', cursor: 'pointer', transition: '0.3s' }}
          >
            Vừa xem gần đây
          </button>
        </div>

        {/* Danh sách */}
        <div className="stack" style={{ gap: '15px' }}>
          {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Đang tải dữ liệu...</div>}
          
          {!isLoading && currentData?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
               {activeTab === 'FOLLOWED' ? 'Bạn chưa theo dõi bác sĩ nào.' : 'Bạn chưa xem hồ sơ bác sĩ nào gần đây.'}
            </div>
          )}

          {currentData?.map((f) => (
            <div key={f.maBacSi} style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative', border: '1px solid #fff' }}>
              
              {/* Nút Tim (Chỉ hiện đỏ nếu nằm trong danh sách Followed) */}
              <button 
                onClick={() => activeTab === 'FOLLOWED' ? unfollow.mutate(f.maBacSi) : navigate(`/app/doctors/${f.maBacSi}`)}
                style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                {activeTab === 'FOLLOWED' ? '❤️' : '🤍'}
              </button>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #24D5DB', overflow: 'hidden' }}>
                    <img src={`https://i.pravatar.cc/150?u=${f.maBacSi}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', backgroundColor: '#22C55E', borderRadius: '50%', border: '2px solid #fff' }}></div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.hoTenBacSi}</div>
                  <div style={{ color: '#24D5DB', fontSize: '13px', fontWeight: '700', margin: '2px 0' }}>{f.chuyenKhoa}</div>
                  
                  <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span>⭐ <b>{f.rating}</b></span>
                    <span style={{ color: '#E5E7EB' }}>|</span>
                    <span>{f.reviews} đánh giá</span>
                    <span style={{ color: '#E5E7EB' }}>|</span>
                    <span>{f.exp} năm KN</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => navigate(`/app/doctors/${f.maBacSi}`)}
                  style={{ flex: 1, padding: '10px', borderRadius: '25px', border: '1.5px solid #24D5DB', backgroundColor: '#fff', color: '#24D5DB', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  XEM CHI TIẾT
                </button>
                <button 
                  onClick={() => navigate(`/app/doctors/${f.maBacSi}/book`)}
                  style={{ flex: 1, padding: '10px', borderRadius: '25px', border: 'none', backgroundColor: '#24D5DB', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(36, 213, 219, 0.2)' }}
                >
                  ĐẶT LỊCH
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}