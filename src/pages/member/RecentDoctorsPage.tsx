import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { clearRecentDoctors, loadRecentDoctors } from '../../utils/recentDoctors'

export function RecentDoctorsPage() {
  const navigate = useNavigate()
  const [list, setList] = useState(() => loadRecentDoctors())

  const hasItems = useMemo(() => list.length > 0, [list.length])

  return (
    <>
      <PageHeader title="Bác sĩ vừa xem" right={<Link to="/app/home">Trang chủ</Link>} />

      {!hasItems ? <div className="muted">Chưa có bác sĩ vừa xem.</div> : null}

      {hasItems ? (
        <>
          <div className="row" style={{ marginBottom: 8 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                clearRecentDoctors()
                setList([])
              }}
            >
              Xóa lịch sử
            </button>
          </div>
          <div className="stack">
            {list.map((d) => (
              <div key={d.maBacSi} className="card row-between">
                <div className="stack" style={{ gap: 4 }}>
                  <div style={{ fontWeight: 900 }}>{d.hoTenDayDu}</div>
                  <div className="muted">
                    {d.chuyenKhoa} • {d.tenCoSoYTe}
                  </div>
                  <div className="muted">{d.diaChiLamViec || '—'}</div>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}>
                  Xem
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}
