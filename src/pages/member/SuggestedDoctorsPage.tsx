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
    <div style={{ backgroundColor: '#F0F9FB', minHeight: '100vh', paddingBottom: '40px' }}>
      <PageHeader 
        title={
          <span
            style={{
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              padding: '8px 24px',
              borderRadius: '24px',
              fontSize: '18px',
              fontWeight: 'bold',
              border: '2px solid #BFDBFE',
              display: 'inline-block',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)',
            }}
          >
            ⭐ Bác sĩ gợi ý
          </span>
        }
        right={<Link className="btn btn-ghost" to="/app/home" style={{ color: '#666', fontWeight: 'bold' }}>Trang chủ</Link>} 
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>
        {query.isError ? (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '2px solid #fecaca',
              color: '#991b1b',
              padding: '14px 18px',
              borderRadius: '14px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {getApiErrorMessage(query.error)}
          </div>
        ) : null}

        {query.isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#2563EB', fontWeight: 'bold', fontSize: '16px' }}>
            🔍 Đang tìm kiếm bác sĩ phù hợp cho bạn...
          </div>
        ) : null}

        {!query.isLoading && list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '16px' }}>
            Chưa có gợi ý nào dành cho bạn hôm nay.
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {list.map((d) => {
            const initials = (d.hoTenDayDu || 'BS').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'BS';
            return (
              <div 
                key={d.maBacSi} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '22px', 
                  borderRadius: '16px', 
                  backgroundColor: '#fff', 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(37, 99, 235, 0.08)',
                  border: '2px solid #DBEAFE',
                  borderLeft: '6px solid #2563EB',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#2563EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(37, 99, 235, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#DBEAFE';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                  {/* Avatar Section */}
                  <div 
                    style={{ 
                      width: '70px', 
                      height: '70px', 
                      borderRadius: '14px', 
                      backgroundColor: '#EFF6FF', 
                      display: 'grid', 
                      placeItems: 'center', 
                      color: '#1D4ED8', 
                      fontWeight: 'bold', 
                      fontSize: '22px', 
                      flexShrink: 0,
                      overflow: 'hidden',
                      border: '3px solid #BFDBFE',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)',
                    }}
                  >
                    {d.anhDaiDien ? (
                      <img
                        src={d.anhDaiDien}
                        alt={d.hoTenDayDu}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Info Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '18px', color: '#1D4ED8', letterSpacing: '-0.3px' }}>
                      {d.hoTenDayDu}
                    </div>
                    <div style={{ fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                      <span style={{ color: '#2563EB', fontWeight: '700' }}>
                        {d.chuyenKhoa}
                      </span>
                      <span style={{ color: '#9CA3AF' }}> • {d.tenCoSoYTe}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📍 <span>{d.diaChiLamViec || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button Section */}
                <button 
                  onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}
                  style={{ 
                    backgroundColor: '#2563EB', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '10px 32px', 
                    borderRadius: '24px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1D4ED8';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Xem
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}