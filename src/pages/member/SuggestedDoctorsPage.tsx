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
    <>
      <PageHeader title="Bác sĩ gợi ý" right={<Link className="btn btn-ghost" to="/app/home">Trang chủ</Link>} />

      <div style={{ padding: '16px' }}>
        {query.isLoading ? (
          <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
            🔍 Đang tìm kiếm bác sĩ phù hợp cho bạn...
          </div>
        ) : null}

        {/* 
        {query.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(query.error)}
          </div>
        ) : null} 
        */}

        {!query.isLoading && list.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
            Chưa có gợi ý nào dành cho bạn hôm nay.
          </div>
        ) : null}

        <div className="stack" style={{ gap: '12px' }}>
          {list.map((d) => (
            <div key={d.maBacSi} className="card row-between" style={{ borderLeft: '4px solid #24D5DB' }}>
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 900, color: '#24D5DB', fontSize: '16px' }}>
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
              >
                Xem
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}