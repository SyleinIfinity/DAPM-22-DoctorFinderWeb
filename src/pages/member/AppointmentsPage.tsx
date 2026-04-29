import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'

type Scope = 'upcoming' | 'history'

function normalizeTime(value: string): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

// Hàm bổ trợ để lấy màu sắc và text hiển thị theo trạng thái phiếu
function getStatusStyles(status: string) {
  switch (status) {
    case 'CHO_DUYET': 
        return { color: '#ffc107', bg: 'rgba(255, 193, 7, 0.1)', label: 'Chờ duyệt' }
    case 'DA_XAC_NHAN': 
        return { color: '#24D5DB', bg: 'rgba(36, 213, 219, 0.1)', label: 'Đã xác nhận' }
    case 'TU_CHOI': 
        return { color: '#ff4d4f', bg: 'rgba(255, 77, 79, 0.1)', label: 'Đã từ chối' }
    case 'THANH_CONG': 
        return { color: '#52c41a', bg: 'rgba(82, 196, 26, 0.1)', label: 'Hoàn thành' }
    default: 
        return { color: '#999', bg: 'rgba(153, 153, 153, 0.1)', label: status }
  }
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null

  const [scope, setScope] = useState<Scope>('upcoming')
  const [showCreate, setShowCreate] = useState(false)

  // --- MOCK DATA ĐỂ TEST UI NHANH ---
  // Thêm "as any" vào cuối mảng để bỏ qua kiểm tra kiểu nghiêm ngặt lúc làm Mock
  const mockUpcoming: AppointmentSummary[] = [
    {
      maPhieuDatLich: 1,
      hoTenBacSi: "BS. Nguyễn Văn A",
      ngayCuThe: "2026-05-10",
      gioBatDau: "08:00:00",
      gioKetThuc: "09:00:00",
      trangThaiPhieu: "DA_XAC_NHAN",
      lyDoTuChoi: null
    },

    {
      maPhieuDatLich: 2,
      hoTenBacSi: "BS. Trần Thị B",
      ngayCuThe: "2026-05-15",
      gioBatDau: "14:30:00",
      gioKetThuc: "15:30:00",
      trangThaiPhieu: "CHO_DUYET",
      lyDoTuChoi: null
    }
  ]as any;

  const mockHistory: AppointmentSummary[] = [
    {
      maPhieuDatLich: 3,
      hoTenBacSi: "BS. Lê Văn C",
      ngayCuThe: "2026-04-20",
      gioBatDau: "10:00:00",
      gioKetThuc: "11:00:00",
      trangThaiPhieu: "THANH_CONG",
      lyDoTuChoi: null
    },
    {
      maPhieuDatLich: 4,
      hoTenBacSi: "BS. Phạm Minh D",
      ngayCuThe: "2026-04-10",
      gioBatDau: "09:00:00",
      gioKetThuc: "10:00:00",
      trangThaiPhieu: "TU_CHOI",
      lyDoTuChoi: "Bác sĩ bận lịch công tác đột xuất"
    }
  ] as any;

  const query = useQuery({
    queryKey: ['appointments', maNguoiDung, scope],
    queryFn: async () => {
        // TẠM THỜI TRẢ VỀ MOCK DATA ĐỂ LÀM UI
        return scope === 'upcoming' ? mockUpcoming : mockHistory;

        // KHI NÀO CÓ API THÌ DÙNG DÒNG DƯỚI:
        // return (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope } })).data
    },
    enabled: true, 
  })

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <div style={{ paddingBottom: '30px' }}>
      <PageHeader
        title="Lịch hẹn của tôi"
        right={
          <button 
            className="btn btn-primary" 
            type="button" 
            onClick={() => setShowCreate(true)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, fontSize: '1.5rem', display: 'grid', placeItems: 'center' }}
          >
            +
          </button>
        }
      />

      {/* TABS Dark Mode */}
      <div className="card" style={{ padding: '4px', backgroundColor: '#1a222d', display: 'flex', gap: '4px', marginBottom: '16px', borderRadius: '12px' }}>
        <button
          className={scope === 'upcoming' ? 'tab tab-active' : 'tab'}
          style={{ flex: 1, borderRadius: '10px', border: 'none', transition: '0.3s', cursor: 'pointer' }}
          onClick={() => setScope('upcoming')}
        >
          Sắp tới
        </button>
        <button
          className={scope === 'history' ? 'tab tab-active' : 'tab'}
          style={{ flex: 1, borderRadius: '10px', border: 'none', transition: '0.3s', cursor: 'pointer' }}
          onClick={() => setScope('history')}
        >
          Lịch sử
        </button>
      </div>

      {query.isLoading && <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>Đang tải lịch hẹn…</div>}
      
      {list.length === 0 && !query.isLoading && (
        <div className="muted" style={{ textAlign: 'center', marginTop: '40px' }}>
          Bạn chưa có phiếu đặt lịch nào ở mục này.
        </div>
      )}

      {/* DANH SÁCH LỊCH HẸN */}
      <div className="stack" style={{ gap: '12px' }}>
        {list.map((a) => {
          const status = getStatusStyles(a.trangThaiPhieu);
          return (
            <div 
              key={a.maPhieuDatLich} 
              className="card" 
              style={{ 
                borderLeft: `4px solid ${status.color}`,
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onClick={() => navigate(`/app/appointments/${a.maPhieuDatLich}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div className="row-between" style={{ alignItems: 'center' }}>
                <div className="stack" style={{ gap: 4 }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{a.hoTenBacSi}</div>
                  <div className="muted" style={{ fontSize: '0.9rem' }}>
                    📅 {a.ngayCuThe} | ⏰ {normalizeTime(a.gioBatDau)}–{normalizeTime(a.gioKetThuc)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '2px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      backgroundColor: status.bg, 
                      color: status.color,
                      border: `1px solid ${status.color}`,
                      textTransform: 'uppercase'
                    }}>
                      {status.label}
                    </span>
                    {a.lyDoTuChoi && (
                      <span className="muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                        Lý do: {a.lyDoTuChoi}
                      </span>
                    )}
                  </div>
                </div>
                <button className="btn" style={{ borderRadius: '10px', padding: '8px 16px' }}>Chi tiết</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL tạo mới */}
      {showCreate && (
        <div
          onClick={() => setShowCreate(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}
        >
          <div
            className="card stack"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(380px, 100%)', textAlign: 'center', padding: '30px', borderRadius: '20px' }}
          >
            <div className="title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Tạo phiếu mới</div>
            <p className="muted" style={{ marginBottom: '20px' }}>Bạn muốn đặt lịch khám với ai?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '14px', fontWeight: 'bold', borderRadius: '12px' }}
                onClick={() => navigate('/app/home')}
              >
                Tìm bác sĩ mới
              </button>
              <button
                className="btn"
                style={{ padding: '14px', fontWeight: 'bold', border: '1px solid #333', borderRadius: '12px' }}
                onClick={() => navigate('/app/appointments/new/known')}
              >
                Bác sĩ đã từng khám
              </button>
              <button 
                className="btn" 
                style={{ marginTop: '10px', color: '#888' }} 
                onClick={() => setShowCreate(false)}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
