import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentSummary, DoctorProfile, FollowedDoctor } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

type SourceTab = 'HISTORY' | 'FOLLOWS'

export function ChooseKnownDoctorPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null
  const [tab, setTab] = useState<SourceTab>('HISTORY')

  // 1. QUERY DANH SÁCH THEO DÕI (API Thật)
  const followsQuery = useQuery({
    queryKey: ['follows', maNguoiDung],
    queryFn: async () => {
      if (!maNguoiDung) return [];
      return (await api.get<FollowedDoctor[]>('/api/follows', { params: { maNguoiDung } })).data;
    },
    enabled: !!maNguoiDung,
  });

  // 2. QUERY LỊCH HẸN SẮP TỚI (API Thật)
  const upcomingQuery = useQuery({
    queryKey: ['appointments', maNguoiDung, 'upcoming'],
    queryFn: async () => {
       try {
         return (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'upcoming' } })).data
       } catch (e) {
         return []
       }
    },
    enabled: !!maNguoiDung,
  })

  // 3. QUERY LỊCH SỬ ĐẶT LỊCH (API Thật)
  const historyQuery = useQuery({
    queryKey: ['appointments', maNguoiDung, 'history'],
    queryFn: async () => {
      try {
        return (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'history' } })).data
      } catch (e) {
        return []
      }
    },
    enabled: !!maNguoiDung,
  })

  // XỬ LÝ LỌC TRÙNG BÁC SĨ TỪ LỊCH SỬ
  const historyDoctors = useMemo(() => {
    const map = new Map<number, any>()
    const all = [...(upcomingQuery.data || []), ...(historyQuery.data || [])]
    for (const a of all) {
      if (a.maBacSi && !map.has(a.maBacSi)) {
        map.set(a.maBacSi, a)
      }
    }
    return Array.from(map.values())
  }, [upcomingQuery.data, historyQuery.data])

  return (
    <main className="member-page-shell" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* HEADER: Áp dụng style label/pill */}
      <PageHeader 
        title={
            <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 20px', borderRadius: '24px', fontSize: '18px', fontWeight: 'bold', border: '1px solid #bfdbfe', display: 'inline-block' }}>
              Bác sĩ quen thuộc
            </span>
        }
        right={
            <Link to="/app/appointments" style={{ backgroundColor: '#ffffff', color: '#4b5563', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', border: '1px solid #d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                🗓 Lịch hẹn
            </Link>
        } 
      />

      <div className="member-layout__page" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '20px' }}>
        
        {/* PILL TAB SWITCHER */}
        <div style={{ display: 'flex', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '9999px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px auto' }}>
          <button 
            onClick={() => setTab('HISTORY')}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '9999px', fontWeight: 'bold', fontSize: '14px',
              backgroundColor: tab === 'HISTORY' ? '#ffffff' : 'transparent',
              color: tab === 'HISTORY' ? '#374151' : '#6b7280',
              boxShadow: tab === 'HISTORY' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Lịch sử đã đặt
          </button>
          <button 
            onClick={() => setTab('FOLLOWS')}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '9999px', fontWeight: 'bold', fontSize: '14px',
              backgroundColor: tab === 'FOLLOWS' ? '#ffffff' : 'transparent',
              color: tab === 'FOLLOWS' ? '#374151' : '#6b7280',
              boxShadow: tab === 'FOLLOWS' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Đang theo dõi
          </button>
        </div>

        {/* HIỂN THỊ LỖI NẾU CÓ */}
        {(tab === 'HISTORY' && (upcomingQuery.isError || historyQuery.isError)) || (tab === 'FOLLOWS' && followsQuery.isError) ? (
          <div className="member-empty-state member-empty-state--error" style={{ marginBottom: '16px' }}>
            {getApiErrorMessage(upcomingQuery.error || historyQuery.error || followsQuery.error)}
          </div>
        ) : null}

        {/* DANH SÁCH BÁC SĨ */}
        <div className="member-doctor-list">
          {tab === 'HISTORY' ? (
            <>
              {historyDoctors.length === 0 && !historyQuery.isLoading && (
                <div className="member-empty-state" style={{ textAlign: 'center' }}>Chưa có bác sĩ nào trong lịch sử đặt.</div>
              )}
              {historyDoctors.map((d) => <DoctorCard key={d.maBacSi} d={d} navigate={navigate} />)}
            </>
          ) : (
            <>
              {(followsQuery.data || []).length === 0 && !followsQuery.isLoading && (
                <div className="member-empty-state" style={{ textAlign: 'center' }}>Bạn chưa theo dõi bác sĩ nào.</div>
              )}
              {(followsQuery.data || []).map((f) => <DoctorCard key={f.maBacSi} d={f} navigate={navigate} />)}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

// COMPONENT CARD BÁC SĨ SỬ DỤNG CLASS CỦA KHÁNH (member-doctor-card)
function DoctorCard({ d, navigate }: { d: any, navigate: any }) {
  const name = d.hoTenBacSi || d.hoTenDayDu || "Bác sĩ";
  const avatarUrl = d.anhDaiDien ?? d.anhDaiDienBacSi ?? null;
  
  return (
    <div 
      className="member-doctor-card" 
      onClick={() => navigate(`/app/doctors/${d.maBacSi}/slots`)}
      style={{ borderLeft: '6px solid #2dd4bf' }} // Thêm điểm nhấn viền trái theo ý thích
    >
      
      {/* 1. Avatar (Hiển thị ảnh nếu có, nếu không thì hiển thị chữ cái) */}
      <div className="member-doctor-card__avatar">
        {avatarUrl ? (
           <img src={avatarUrl} alt={name} />
        ) : (
           <span style={{ color: '#0f766e', fontSize: '24px' }}>{name.replace('BS. ', '').charAt(0)}</span>
        )}
      </div>

      {/* 2. Thông tin */}
      <div className="member-doctor-card__body">
        <h3 style={{ color: '#0f766e' }}>{name}</h3>
        <p>
          <span className="member-link" style={{ color: '#2dd4bf' }}>{d.chuyenKhoa}</span> • {d.tenCoSoYTe}
        </p>
        <p className="member-doctor-card__muted">
          📍 {d.diaChiLamViec || 'Đang cập nhật'}
        </p>
      </div>

      {/* 3. Nút bấm */}
      <div className="member-doctor-card__cta">
        <button 
            className="btn btn-primary"
            style={{ borderRadius: '9999px', backgroundColor: '#2dd4bf', padding: '8px 24px' }}
            onClick={(e) => {
                e.stopPropagation(); // Ngăn sự kiện click lan ra thẻ cha
                navigate(`/app/doctors/${d.maBacSi}/slots`);
            }}
        >
          Chọn
        </button>
      </div>
    </div>
  )
}