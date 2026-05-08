import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

type SourceTab = 'HISTORY' | 'FOLLOWS'

export function ChooseKnownDoctorPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null
  const [tab, setTab] = useState<SourceTab>('HISTORY')

  // 1. QUERY DANH SÁCH THEO DÕI
  const followsQuery = useQuery({
    queryKey: ['follows', maNguoiDung],
    queryFn: async () => {
      // --- COMMAND API THẬT ---
      // return (await api.get<any[]>('/api/follows', { params: { maNguoiDung } })).data,

      // --- MOCK DATA GIẢ LẬP ---
      await new Promise(r => setTimeout(r, 500));
      return [
        { 
          maBacSi: 20, 
          hoTenBacSi: "BS. Lê Thị Tuyết", 
          chuyenKhoa: "Nhi khoa", 
          tenCoSoYTe: "Bệnh viện Nhi Đồng 1", 
          diaChiLamViec: "Quận 10, TP.HCM" 
        },
        { 
          maBacSi: 21, 
          hoTenBacSi: "BS. Trần Văn B", 
          chuyenKhoa: "Da liễu", 
          tenCoSoYTe: "Phòng khám tư", 
          diaChiLamViec: "Quận 3, TP.HCM" 
        }
      ];
    },
    enabled: true,
  });

  // 2. QUERY LỊCH HẸN SẮP TỚI
  const upcomingQuery = useQuery({
    queryKey: ['appointments', maNguoiDung, 'upcoming'],
    queryFn: async () => {
       // Giả lập trả về mảng rỗng nếu chưa có API
       try {
         return (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'upcoming' } })).data
       } catch (e) {
         return []
       }
    },
    enabled: !!maNguoiDung,
  })

  // 3. QUERY LỊCH SỬ ĐẶT LỊCH
  const historyQuery = useQuery({
    queryKey: ['appointments', maNguoiDung, 'history'],
    queryFn: async () => {
      // --- COMMAND API THẬT ---
      // return (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'history' } })).data

      // --- MOCK DATA GIẢ LẬP ---
      await new Promise(r => setTimeout(r, 500));
      return [
        { maBacSi: 1, hoTenBacSi: "BS. Nguyễn Văn Nhân", chuyenKhoa: "Nội khoa", tenCoSoYTe: "BV Chợ Rẫy", diaChiLamViec: "Quận 5, TP.HCM" }
      ];
    },
    enabled: true,
  })

  // XỬ LÝ LỌC TRÙNG BÁC SĨ TỪ LỊCH SỬ (Upcoming + History)
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
    <div style={{ backgroundColor: '#F8FAFB', minHeight: '100vh', paddingBottom: '40px' }}>
      <PageHeader 
        title="Bác sĩ quen thuộc" 
        right={<Link to="/app/appointments" style={{ color: '#24D5DB', textDecoration: 'none', fontWeight: 'bold' }}>Lịch hẹn</Link>} 
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        {/* PILL TAB SWITCHER */}
        <div style={{ display: 'flex', backgroundColor: '#E9ECEF', padding: '4px', borderRadius: '15px', marginBottom: '25px' }}>
          <button 
            onClick={() => setTab('HISTORY')}
            style={{
              flex: 1, padding: '12px', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
              backgroundColor: tab === 'HISTORY' ? '#fff' : 'transparent',
              color: tab === 'HISTORY' ? '#1A1A1A' : '#6C757D',
              boxShadow: tab === 'HISTORY' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer', transition: '0.3s'
            }}
          >
            Lịch sử đã đặt
          </button>
          <button 
            onClick={() => setTab('FOLLOWS')}
            style={{
              flex: 1, padding: '12px', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
              backgroundColor: tab === 'FOLLOWS' ? '#fff' : 'transparent',
              color: tab === 'FOLLOWS' ? '#1A1A1A' : '#6C757D',
              boxShadow: tab === 'FOLLOWS' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer', transition: '0.3s'
            }}
          >
            Đang theo dõi
          </button>
        </div>

        {/* HIỂN THỊ LỖI NẾU CÓ */}
        {(tab === 'HISTORY' && (upcomingQuery.isError || historyQuery.isError)) || (tab === 'FOLLOWS' && followsQuery.isError) ? (
          <div style={{ backgroundColor: '#FFF1F0', border: '1px solid #FFA39E', padding: '15px', borderRadius: '15px', color: '#CF1322', marginBottom: '15px', fontSize: '14px' }}>
            {getApiErrorMessage(upcomingQuery.error || historyQuery.error || followsQuery.error)}
          </div>
        ) : null}

        {/* DANH SÁCH BÁC SĨ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {tab === 'HISTORY' ? (
            <>
              {historyDoctors.length === 0 && !historyQuery.isLoading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>Chưa có bác sĩ nào trong lịch sử đặt.</div>
              )}
              {historyDoctors.map((d) => <DoctorCard key={d.maBacSi} d={d} navigate={navigate} />)}
            </>
          ) : (
            <>
              {(followsQuery.data || []).length === 0 && !followsQuery.isLoading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>Bạn chưa theo dõi bác sĩ nào.</div>
              )}
              {(followsQuery.data || []).map((f) => <DoctorCard key={f.maBacSi} d={f} navigate={navigate} />)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// COMPONENT CARD BÁC SĨ
function DoctorCard({ d, navigate }: { d: any, navigate: any }) {
  const name = d.hoTenBacSi || d.hoTenDayDu || "Bác sĩ";
  
  return (
    <div style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '18px 20px', backgroundColor: '#fff', borderRadius: '24px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* Avatar chữ cái */}
        <div style={{ 
          width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#E6FFFA', 
          display: 'grid', placeItems: 'center', color: '#0D9488', fontWeight: 'bold', fontSize: '18px' 
        }}>
          {name.split(' ').pop()?.charAt(0)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontWeight: '800', fontSize: '16px', color: '#1A1A1A' }}>{name}</div>
          <div style={{ fontSize: '13px', color: '#6C757D' }}>
            <span style={{ fontWeight: 'bold', color: '#24D5DB' }}>{d.chuyenKhoa}</span> • {d.tenCoSoYTe}
          </div>
          <div style={{ fontSize: '12px', color: '#8C8C8C' }}>📍 {d.diaChiLamViec || '—'}</div>
        </div>
      </div>

      <button 
        onClick={() => navigate(`/app/doctors/${d.maBacSi}/slots`)}
        style={{ 
          backgroundColor: '#24D5DB', color: '#fff', border: 'none', 
          padding: '10px 22px', borderRadius: '12px', fontWeight: 'bold', 
          fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(36, 213, 219, 0.2)',
          transition: '0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        Chọn
      </button>
    </div>
  )
}