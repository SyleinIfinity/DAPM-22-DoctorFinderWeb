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

  const followsQuery = useQuery({
  queryKey: ['follows', maNguoiDung],
  queryFn: async () => {
    // API
    // (await api.get<FollowedDoctor[]>('/api/follows', { params: { maNguoiDung } })).data,

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

  const upcomingQuery = useQuery({
    queryKey: ['appointments', maNguoiDung, 'upcoming'],
    queryFn: async () =>
      (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'upcoming' } })).data,
    enabled: !!maNguoiDung,
  })

  // const historyQuery = useQuery({
  //   queryKey: ['appointments', maNguoiDung, 'history'],
  //   queryFn: async () =>
  //     (await api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'history' } })).data,
  //   enabled: !!maNguoiDung,
  // })
  const historyQuery = useQuery({
  queryKey: ['appointments', maNguoiDung, 'history'],
  queryFn: async () => {
    // api.get<AppointmentSummary[]>('/api/appointments', { params: { maNguoiDung, scope: 'history' } }) -- COMMAND LẠI
    await new Promise(r => setTimeout(r, 500));
    return [
      { maBacSi: 1, hoTenBacSi: "BS. Nguyễn Văn Nhân", chuyenKhoa: "Nội khoa", tenCoSoYTe: "BV Chợ Rẫy", diaChiLamViec: "TP.HCM" }
    ];
  },
  enabled: true,
})

  const historyDoctors = useMemo(() => {
    const map = new Map<number, { maBacSi: number; hoTenBacSi: string; chuyenKhoa: string; tenCoSoYTe: string; diaChiLamViec: string | null }>()
    const all = [...(upcomingQuery.data || []), ...(historyQuery.data || [])]
    for (const a of all) {
      if (!map.has(a.maBacSi)) {
        map.set(a.maBacSi, {
          maBacSi: a.maBacSi,
          hoTenBacSi: a.hoTenBacSi,
          chuyenKhoa: a.chuyenKhoa,
          tenCoSoYTe: a.tenCoSoYTe,
          diaChiLamViec: a.diaChiLamViec,
        })
      }
    }
    return Array.from(map.values())
  }, [upcomingQuery.data, historyQuery.data])

  return (
    <>
      <PageHeader title="Chọn bác sĩ đã biết" right={<Link to="/app/appointments">Đặt lịch</Link>} />

      <div className="card stack">
        <div className="tabs">
          <button className={tab === 'HISTORY' ? 'tab tab-active' : 'tab'} type="button" onClick={() => setTab('HISTORY')}>
            Lịch sử đã đặt
          </button>
          <button className={tab === 'FOLLOWS' ? 'tab tab-active' : 'tab'} type="button" onClick={() => setTab('FOLLOWS')}>
            Danh sách theo dõi
          </button>
        </div>

        {/* {!maNguoiDung ? <div className="muted">Thiếu maNguoiDung. Hãy đăng nhập lại.</div> : null} */}
        {tab === 'HISTORY' && (upcomingQuery.isError || historyQuery.isError) ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(upcomingQuery.error || historyQuery.error)}
          </div>
        ) : null}
        {tab === 'FOLLOWS' && followsQuery.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(followsQuery.error)}
          </div>
        ) : null}
      </div>

      <div style={{ height: 12 }} />

      {tab === 'HISTORY' ? (
        <div className="stack">
          {historyDoctors.length === 0 ? <div className="muted">Chưa có bác sĩ trong lịch sử đặt.</div> : null}
          {historyDoctors.map((d) => (
            <div key={d.maBacSi} className="card row-between">
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 900 }}>{d.hoTenBacSi}</div>
                <div className="muted">
                  {d.chuyenKhoa} • {d.tenCoSoYTe}
                </div>
                <div className="muted">{d.diaChiLamViec || '—'}</div>
              </div>
              <button className="btn btn-primary" type="button" onClick={() => navigate(`/app/doctors/${d.maBacSi}/slots`)}>
                Chọn
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="stack">
          {(followsQuery.data || []).length === 0 ? <div className="muted">Bạn chưa theo dõi bác sĩ nào.</div> : null}
          {(followsQuery.data || []).map((f) => (
            <div key={f.maBacSi} className="card row-between">
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 900 }}>{f.hoTenBacSi}</div>
                <div className="muted">
                  {f.chuyenKhoa} • {f.tenCoSoYTe}
                </div>
                <div className="muted">{f.diaChiLamViec || '—'}</div>
              </div>
              <button className="btn btn-primary" type="button" onClick={() => navigate(`/app/doctors/${f.maBacSi}/slots`)}>
                Chọn
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

