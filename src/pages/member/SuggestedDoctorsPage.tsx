import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
// import { api } from '../../api/http'
// import type { DoctorProfile } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
// import { getApiErrorMessage } from '../../utils/errors'

export function SuggestedDoctorsPage() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['suggested-doctors'],
    queryFn: async () => {
      // --- COMMAND API THẬT ---
      /*
      return (
        await api.get<DoctorProfile[]>('/api/doctors/search', {
          params: { trangThaiHoSo: 'DA_DUYET', limit: 12, offset: 0 },
        })
      ).data
      */

      // --- MOCK DATA ĐỂ XEM TRƯỚC GIAO DIỆN ---
      await new Promise(resolve => setTimeout(resolve, 800)); // Giả lập chờ 0.8s
      return [
        {
          maBacSi: 501,
          hoTenDayDu: "BS. Trương Hoàng Long",
          chuyenKhoa: "Răng Hàm Mặt",
          tenCoSoYTe: "Bệnh viện Răng Hàm Mặt Trung Ương",
          diaChiLamViec: "Quận 1, TP.HCM"
        },
        {
          maBacSi: 502,
          hoTenDayDu: "BS. Ngô Bảo Châu",
          chuyenKhoa: "Ngoại thần kinh",
          tenCoSoYTe: "Bệnh viện Chợ Rẫy",
          diaChiLamViec: "Quận 5, TP.HCM"
        },
        {
          maBacSi: 503,
          hoTenDayDu: "BS. Đặng Thùy Trâm",
          chuyenKhoa: "Sản phụ khoa",
          tenCoSoYTe: "Bệnh viện Từ Dũ",
          diaChiLamViec: "Quận 1, TP.HCM"
        }
      ];
    },
  })

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <div style={{ backgroundColor: '#F8FAFB', minHeight: '100vh' }}>
      <PageHeader 
        title="Bác sĩ gợi ý" 
        right={<Link className="btn btn-ghost" to="/app/home" style={{ color: '#666', fontWeight: 'bold' }}>Trang chủ</Link>} 
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {query.isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#24D5DB', fontWeight: 'bold' }}>
            🔍 Đang tìm kiếm bác sĩ phù hợp cho bạn...
          </div>
        ) : null}

        {!query.isLoading && list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Chưa có gợi ý nào dành cho bạn hôm nay.
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {list.map((d) => (
            <div 
              key={d.maBacSi} 
              className="card" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '20px', 
                borderRadius: '24px', 
                backgroundColor: '#fff', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', 
                border: '1px solid #f1f3f5',
                borderLeft: '5px solid #24D5DB' // Nhấn mạnh phần gợi ý
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Avatar tròn bên trái */}
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  backgroundColor: '#E6FFFA', 
                  display: 'grid', 
                  placeItems: 'center', 
                  color: '#0D9488', 
                  fontWeight: 'bold', 
                  fontSize: '20px', 
                  flexShrink: 0 
                }}>
                  {d.hoTenDayDu.split(' ').pop()?.charAt(0)}
                </div>

                {/* Thông tin bác sĩ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: '800', fontSize: '17px', color: '#24D5DB' }}>
                    {d.hoTenDayDu}
                  </div>
                  <div style={{ fontSize: '14px', color: '#444' }}>
                    <strong>{d.chuyenKhoa}</strong> • {d.tenCoSoYTe}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888' }}>
                    📍 {d.diaChiLamViec || '—'}
                  </div>
                </div>
              </div>

              {/* Nút Xem bên phải */}
              <button 
                onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}
                style={{ 
                  backgroundColor: '#24D5DB', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '10px 25px', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(36, 213, 219, 0.2)'
                }}
              >
                Xem
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}