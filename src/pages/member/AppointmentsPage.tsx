import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'

type Scope = 'upcoming' | 'history'

function normalizeTime(value: string | null): string {
  if (!value) return '--:--'
  return value.slice(0, 5)
}

function getStatusStyles(status: string | null) {
  switch (status) {
    case 'CHO_DUYET': return { color: '#FAAD14', bg: '#FFFBE6', border: '#FFE58F', label: 'Chờ duyệt' }
    case 'DA_XAC_NHAN': return { color: '#13C2C2', bg: '#E6FFFB', border: '#87E8DE', label: 'Sắp tới' }
    case 'THANH_CONG': return { color: '#52C41A', bg: '#F6FFED', border: '#B7EB8F', label: 'Hoàn thành' }
    case 'TU_CHOI': return { color: '#FF4D4F', bg: '#FFF1F0', border: '#FFA39E', label: 'Đã từ chối' }
    default: return { color: '#8C8C8C', bg: '#F5F5F5', border: '#D9D9D9', label: 'Không xác định' }
  }
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null
  const [scope, setScope] = useState<Scope>('upcoming')
  const [showCreate, setShowCreate] = useState(false)

  const mockUpcoming: AppointmentSummary[] = [
    { maPhieuDatLich: 1, hoTenBacSi: "BS. Nguyễn Thanh Tùng", ngayCuThe: "2026-05-10", gioBatDau: "08:30:00", gioKetThuc: "09:00:00", trangThaiPhieu: "DA_XAC_NHAN" },
    { maPhieuDatLich: 2, hoTenBacSi: "BS. Lê Minh Nhân", ngayCuThe: "2026-05-15", gioBatDau: "14:00:00", gioKetThuc: "14:30:00", trangThaiPhieu: "CHO_DUYET" }
  ] as any;

  const mockHistory: AppointmentSummary[] = [
    { maPhieuDatLich: 3, hoTenBacSi: "BS. Phạm Hòa", ngayCuThe: "2026-04-20", gioBatDau: "10:00:00", gioKetThuc: "10:30:00", trangThaiPhieu: "THANH_CONG" }
  ] as any;

  const query = useQuery({
    queryKey: ['appointments', maNguoiDung, scope],
    queryFn: async () => scope === 'upcoming' ? mockUpcoming : mockHistory,
  })

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <div style={{ backgroundColor: '#F4F7F8', minHeight: '100vh', paddingBottom: '100px' }}>
      <PageHeader 
        title="Lịch hẹn của tôi" 
        right={<button onClick={() => setShowCreate(true)} style={{ border: 'none', background: '#24D5DB', color: '#fff', width: 38, height: 38, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}>+</button>} 
      />

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '10px 20px' }}>
        <div style={{ display: 'flex', backgroundColor: '#E5E7EB', padding: '4px', borderRadius: '15px', marginBottom: '25px' }}>
          <button onClick={() => setScope('upcoming')} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '12px', fontWeight: '800', backgroundColor: scope === 'upcoming' ? '#fff' : 'transparent', color: scope === 'upcoming' ? '#24D5DB' : '#6B7280', cursor: 'pointer' }}>Sắp tới</button>
          <button onClick={() => setScope('history')} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '12px', fontWeight: '800', backgroundColor: scope === 'history' ? '#fff' : 'transparent', color: scope === 'history' ? '#24D5DB' : '#6B7280', cursor: 'pointer' }}>Lịch sử</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {list.map((a) => {
            const status = getStatusStyles(a.trangThaiPhieu);
            const dateParts = (a.ngayCuThe || "----/--/--").split('-'); 
            
            return (
              <div 
                key={a.maPhieuDatLich}
                onClick={() => navigate(`/app/appointments/${a.maPhieuDatLich}`)}
                style={{
                  backgroundColor: '#fff', borderRadius: '24px', padding: '20px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.03)', cursor: 'pointer',
                  border: '1px solid #F1F3F5', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {/* Khối Ngày tháng */}
                  <div style={{ backgroundColor: '#F0FDFA', borderRadius: '18px', padding: '10px', minWidth: '65px', textAlign: 'center', border: '1px solid #CCFBF1' }}>
                    <div style={{ fontSize: '11px', color: '#0D9488', fontWeight: '800' }}>THG {dateParts[1]}</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#0D9488' }}>{dateParts[2]}</div>
                  </div>

                  {/* Thông tin ở giữa */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1A1A1A' }}>{a.hoTenBacSi}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                      ⏰ {normalizeTime(a.gioBatDau)} - {normalizeTime(a.gioKetThuc)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px dotted #EEE' }}>
                  <div style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                    {status.label.toUpperCase()}
                  </div>
                  
                  {/* NÚT CHI TIẾT ĐÃ THÊM TẠI ĐÂY */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#24D5DB', fontWeight: 'bold' }}>
                    Xem chi tiết <span style={{ fontSize: '16px' }}>›</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL (GIỮ NGUYÊN) */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000 }} onClick={() => setShowCreate(false)}>
          <div style={{ backgroundColor: '#fff', width: '90%', maxWidth: '380px', borderRadius: '28px', padding: '30px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '900', marginBottom: '10px' }}>Đặt lịch mới</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => navigate('/app/home')} style={{ padding: '15px', borderRadius: '15px', border: 'none', backgroundColor: '#24D5DB', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>🔍 Tìm bác sĩ chuyên khoa</button>
              <button onClick={() => navigate('/app/appointments/new/known')} style={{ padding: '15px', borderRadius: '15px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#374151', fontWeight: 'bold', cursor: 'pointer' }}>👤 Bác sĩ đã từng khám</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}