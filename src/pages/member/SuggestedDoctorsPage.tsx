import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { DoctorProfile } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'
import { useAuth } from '../../auth/AuthContext'

export function SuggestedDoctorsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const query = useQuery({
    queryKey: ['suggested-doctors', session?.maTaiKhoan],
    queryFn: async () =>
      (
        await api.get<DoctorProfile[]>('/api/doctors/search', {
          params: {
            trangThaiHoSo: 'DA_DUYET',
            limit: 12,
            offset: 0,
            ...(session?.maTaiKhoan ? { viewerMaTaiKhoan: session.maTaiKhoan } : {}),
          },
        })
      ).data,
  })

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <div style={{ backgroundColor: '#F8FAFB', minHeight: '100vh' }}>
      <PageHeader 
        title="Bác sĩ gợi ý" 
        right={<Link className="btn btn-ghost" to="/app/home" style={{ color: '#666', fontWeight: 'bold' }}>Trang chủ</Link>} 
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {query.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.5)', marginBottom: 16 }}>
            {getApiErrorMessage(query.error)}
          </div>
        ) : null}

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
                  {(d.hoTenDayDu || '?').split(' ').pop()?.charAt(0) ?? '?'}
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