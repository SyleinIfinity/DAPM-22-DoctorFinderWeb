import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { clearRecentDoctors, loadRecentDoctors } from '../../utils/recentDoctors'

export function RecentDoctorsPage() {
  const navigate = useNavigate()
  
  // Khởi tạo state từ localStorage
  const [list, setList] = useState(() => {
    const saved = loadRecentDoctors()
    // Nếu chưa có dữ liệu thật, trả về mảng mẫu để test UI
    if (saved.length === 0) {
      return [
        { 
          maBacSi: 201, 
          hoTenDayDu: "BS. Trương Hoàng Long", 
          chuyenKhoa: "Răng Hàm Mặt", 
          tenCoSoYTe: "BV Răng Hàm Mặt Trung Ương", 
          diaChiLamViec: "Quận 1, TP.HCM" 
        },
        { 
          maBacSi: 202, 
          hoTenDayDu: "BS. Ngô Bảo Châu", 
          chuyenKhoa: "Ngoại thần kinh", 
          tenCoSoYTe: "Bệnh viện Chợ Rẫy", 
          diaChiLamViec: "Quận 5, TP.HCM" 
        }
      ]
    }
    return saved
  })

  const hasItems = useMemo(() => list.length > 0, [list.length])

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?")) {
      clearRecentDoctors()
      setList([])
    }
  }

  return (
    <>
      <PageHeader 
        title="Bác sĩ vừa xem" 
        right={<Link className="btn btn-ghost" to="/app/home">Trang chủ</Link>} 
      />

      <div style={{ padding: '16px' }}>
        {!hasItems ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p className="muted">Chưa có bác sĩ vừa xem gần đây.</p>
            <Link to="/app/home" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Tìm kiếm bác sĩ ngay
            </Link>
          </div>
        ) : (
          <>
            {/* Thanh công cụ xóa lịch sử */}
            <div className="row-between" style={{ marginBottom: '16px' }}>
              <span className="muted">{list.length} bác sĩ đã xem</span>
              <button
                className="btn btn-danger-ghost"
                type="button"
                onClick={handleClear}
                style={{ fontSize: '14px' }}
              >
                🗑 Xóa lịch sử
              </button>
            </div>

            {/* Danh sách Card */}
            <div className="stack" style={{ gap: '12px' }}>
              {list.map((d) => (
                <div key={d.maBacSi} className="card row-between" style={{ alignItems: 'center' }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#24D5DB' }}>
                      {d.hoTenDayDu}
                    </div>
                    <div className="muted" style={{ fontSize: '14px' }}>
                      <strong>{d.chuyenKhoa}</strong> • {d.tenCoSoYTe}
                    </div>
                    <div className="muted" style={{ fontSize: '13px' }}>
                      📍 {d.diaChiLamViec || '—'}
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    type="button" 
                    onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}
                    style={{ minWidth: '80px' }}
                  >
                    Xem lại
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
