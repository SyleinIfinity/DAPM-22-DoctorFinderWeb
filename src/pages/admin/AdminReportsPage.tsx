import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminDoctorProfileTrafficReport, AdminReportDoctorRank, AdminReportKeyword } from '../../api/types'
import { getApiErrorMessage } from '../../utils/errors'
import { DoctorAvatar, DoctorNotice, DoctorPageHeading, DoctorPanel } from '../doctor/doctorUi'

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const fmt = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
  }
  return { from: fmt(from), to: fmt(to) }
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

function MiniLineChart({ items }: { items: Array<{ label: string; value: number }> }) {
  const width = 360
  const height = 120
  const max = Math.max(1, ...items.map((i) => i.value))
  const step = items.length > 1 ? width / (items.length - 1) : width
  const points = items.map((item, idx) => {
    const x = idx * step
    const y = height - (item.value / max) * (height - 20) - 10
    return { ...item, x, y }
  })
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mini-line-chart">
      <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="rgba(59,130,246,0.12)" />
      <path d={d} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={`${p.label}-${i}`} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
      ))}
    </svg>
  )
}

function MiniBarChart({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="mini-chart mini-chart--bar">
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="mini-chart__bar-wrap">
          <div className="mini-chart__value">{item.value}</div>
          <div className="mini-chart__bar" style={{ height: `${(item.value / max) * 100}%`, background: item.color }} />
          <div className="mini-chart__label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function DoctorBars({ items }: { items: Array<{ label: string; visit: number; follow: number; rating: number }> }) {
  const max = Math.max(1, ...items.flatMap((i) => [i.visit, i.follow, i.rating]))
  return (
    <div className="doctor-bars">
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="doctor-bars__group">
          <div className="doctor-bars__title">{item.label}</div>
          <div className="doctor-bars__cluster">
            <div className="doctor-bars__col"><span style={{ height: `${(item.visit / max) * 100}%`, background: '#3b82f6' }} /></div>
            <div className="doctor-bars__col"><span style={{ height: `${(item.follow / max) * 100}%`, background: '#22c55e' }} /></div>
            <div className="doctor-bars__col"><span style={{ height: `${(item.rating / max) * 100}%`, background: '#f59e0b' }} /></div>
          </div>
          <div className="doctor-bars__legend">Visit / Follow / Rating</div>
        </div>
      ))}
    </div>
  )
}

export function AdminReportsPage() {
  const { from: defaultFrom, to: defaultTo } = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)

  const params = useMemo(() => ({ from: from.length === 16 ? `${from}:00` : from, to: to.length === 16 ? `${to}:00` : to }), [from, to])

  const trafficQuery = useQuery({
    queryKey: ['admin-report-traffic', params.from, params.to],
    queryFn: async () => (await api.get<AdminDoctorProfileTrafficReport>('/api/admin/reports/doctor-profile-traffic', { params: { ...params, top: 7 } })).data,
  })

  const topViewQuery = useQuery({
    queryKey: ['admin-report-top-view', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'view', limit: 7 } })).data,
  })

  const topFollowQuery = useQuery({
    queryKey: ['admin-report-top-follow', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'follow', limit: 7 } })).data,
  })

  const keywordsQuery = useQuery({
    queryKey: ['admin-report-keywords', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportKeyword[]>('/api/admin/reports/top-search-keywords', { params: { ...params, limit: 10 } })).data,
  })

  const doctorRows = useMemo(() => {
    const views = topViewQuery.data || []
    const follows = topFollowQuery.data || []
    const map = new Map<number, { maBacSi: number; hoTen: string; visit: number; follow: number; rating: number }>()
    views.forEach((d) => map.set(d.maBacSi, { maBacSi: d.maBacSi, hoTen: d.hoTenDayTu, visit: d.count, follow: 0, rating: 0 }))
    follows.forEach((d) => {
      const row = map.get(d.maBacSi) || { maBacSi: d.maBacSi, hoTen: d.hoTenDayTu, visit: 0, follow: 0, rating: 0 }
      row.follow = d.count
      row.hoTen = d.hoTenDayTu
      map.set(d.maBacSi, row)
    })
    return Array.from(map.values()).map((r) => ({ ...r, rating: Number(((r.visit + r.follow) / 1000).toFixed(1)) }))
  }, [topViewQuery.data, topFollowQuery.data])

  const selected = doctorRows.find((d) => d.maBacSi === selectedDoctor) || doctorRows[0] || null
  const topDoctor = trafficQuery.data?.slices?.[0]

  return (
    <div className="doctor-page reports-page">
      <DoctorPageHeading eyebrow="Admin reports" title="HIỆU SUẤT BÁC SĨ" description="Theo dõi lượt ghé thăm, follow và đánh giá của bác sĩ." />

      <DoctorPanel title="Khoảng thời gian" description="Chọn mốc thời gian để lọc tất cả biểu đồ.">
        <div className="doctor-form-grid doctor-form-grid--compact">
          <div className="doctor-field">
            <label className="doctor-label" htmlFor="report-from">Từ</label>
            <input id="report-from" type="datetime-local" className="doctor-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="doctor-field">
            <label className="doctor-label" htmlFor="report-to">Đến</label>
            <input id="report-to" type="datetime-local" className="doctor-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </DoctorPanel>

      <div className="reports-top-grid">
        <DoctorPanel title="Tổng lượt ghé thăm website theo giờ (visits/hour)" description="Line chart nhỏ mô tả lượt ghé thăm">
          <MiniLineChart items={(trafficQuery.data?.slices || []).map((s) => ({ label: s.label, value: s.value }))} />
        </DoctorPanel>

        <DoctorPanel title={selected ? `Bác sĩ nổi bật hiện tại: ${selected.hoTen}` : 'Bác sĩ nổi bật hiện tại'} description={selected ? `${selected.hoTen} • ${topDoctor?.label ?? 'Chuyên khoa'}` : 'Chưa có dữ liệu'}>
          <div className="featured-doctor">
            <DoctorAvatar name={selected?.hoTen || 'Bác sĩ'} imageUrl={undefined} size={96} />
            <div className="featured-doctor__meta">
              <div className="featured-doctor__title">{selected?.hoTen || 'Chưa có dữ liệu'}</div>
              <div className="featured-doctor__subtitle">{topDoctor ? `${topDoctor.label}` : 'Chưa có chuyên khoa'}</div>
            </div>
          </div>
        </DoctorPanel>

        <DoctorPanel title="Từ khóa được sử dụng nhiều nhất" description="Biểu đồ cột so sánh tất cả từ khóa được sử dụng">
          <MiniBarChart items={(keywordsQuery.data || []).slice(0, 6).map((k, idx) => ({ label: k.keyword, value: k.count, color: COLORS[idx % COLORS.length] }))} />
        </DoctorPanel>
      </div>

      <div className="reports-middle-grid">
        <DoctorPanel title="Danh sách bác sĩ" description="Chọn bác sĩ để xem dữ liệu chi tiết">
          <div className="doctor-list doctor-list--compact">
            {doctorRows.map((doctor) => (
              <button
                key={doctor.maBacSi}
                type="button"
                className={`doctor-list-card doctor-list-card--button ${selected?.maBacSi === doctor.maBacSi ? 'is-active' : ''}`}
                onClick={() => setSelectedDoctor(doctor.maBacSi)}
              >
                <div className="doctor-list-card__header">
                  <div>
                    <h3 className="doctor-list-card__title">{doctor.hoTen}</h3>
                    <p className="doctor-list-card__subtitle">ID #{doctor.maBacSi}</p>
                  </div>
                  <span className="doctor-chip">{doctor.rating}/5</span>
                </div>
              </button>
            ))}
            {!doctorRows.length ? <DoctorNotice tone="neutral" title="Chưa có dữ liệu" description="Chưa có danh sách bác sĩ trong khoảng thời gian này." /> : null}
          </div>
        </DoctorPanel>

        <DoctorPanel title="Biểu đồ chỉ số bác sĩ" description="Mỗi bác sĩ có 3 cột: Lượt ghé thăm, Lượt follow, Sao đánh giá">
          <DoctorBars items={doctorRows.slice(0, 7).map((doctor) => ({ label: doctor.hoTen, visit: doctor.visit, follow: doctor.follow, rating: doctor.rating }))} />
          {trafficQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải dữ liệu" description={getApiErrorMessage(trafficQuery.error)} /> : null}
        </DoctorPanel>
      </div>

      <DoctorPanel title="Bảng biểu thị nội dung biểu đồ" description="Bảng chi tiết tương ứng với biểu đồ phía trên">
        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Lượt ghé thăm</th>
                <th>Lượt follow</th>
                <th>Sao đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {doctorRows.map((doctor) => (
                <tr key={doctor.maBacSi} className={selected?.maBacSi === doctor.maBacSi ? 'is-active' : ''}>
                  <td>{doctor.hoTen}</td>
                  <td>{doctor.visit}</td>
                  <td>{doctor.follow}</td>
                  <td>{doctor.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DoctorPanel>
    </div>
  )
}
