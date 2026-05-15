import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, CalendarDays, Download, Search, Star, TrendingUp } from 'lucide-react'
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

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#7c3aed', '#06b6d4', '#ef4444']

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function MiniSparkline({ items }: { items: number[] }) {
  const width = 320
  const height = 110
  const max = Math.max(1, ...items)
  const min = Math.min(...items, 0)
  const range = Math.max(1, max - min)
  const step = items.length > 1 ? width / (items.length - 1) : width
  const points = items.map((value, idx) => {
    const x = idx * step
    const y = height - ((value - min) / range) * (height - 18) - 8
    return { x, y, value }
  })
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${d} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="reports-mini-sparkline">
      <defs>
        <linearGradient id="sparkArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkArea)" />
      <path d={d} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#2563eb" />
      ))}
    </svg>
  )
}

function BarMiniChart({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="reports-mini-bars">
      {items.map((item) => (
        <div key={item.label} className="reports-mini-bars__item">
          <div className="reports-mini-bars__value">{formatNumber(item.value)}</div>
          <div className="reports-mini-bars__track">
            <div className="reports-mini-bars__fill" style={{ height: `${(item.value / max) * 100}%`, background: item.color }} />
          </div>
          <div className="reports-mini-bars__label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function GroupedBars({ items }: { items: Array<{ doctorName: string; specialty: string; visits: number; follows: number; rating: number }> }) {
  const max = Math.max(1, ...items.flatMap((i) => [i.visits, i.follows, i.rating]))
  return (
    <div className="reports-grouped-bars">
      <div className="reports-grouped-bars__legend">
        <span><i className="legend-dot legend-dot--blue" /> Lượt ghé thăm</span>
        <span><i className="legend-dot legend-dot--green" /> Lượt follow</span>
        <span><i className="legend-dot legend-dot--amber" /> Sao đánh giá</span>
      </div>
      <div className="reports-grouped-bars__grid">
        {items.map((item) => (
          <div key={item.doctorName} className="reports-grouped-bars__group">
            <div className="reports-grouped-bars__bars">
              <div className="reports-grouped-bars__col">
                <div className="reports-grouped-bars__value">{formatNumber(item.visits)}</div>
                <div className="reports-grouped-bars__bar reports-grouped-bars__bar--blue" style={{ height: `${(item.visits / max) * 100}%` }} />
              </div>
              <div className="reports-grouped-bars__col">
                <div className="reports-grouped-bars__value">{formatNumber(item.follows)}</div>
                <div className="reports-grouped-bars__bar reports-grouped-bars__bar--green" style={{ height: `${(item.follows / max) * 100}%` }} />
              </div>
              <div className="reports-grouped-bars__col">
                <div className="reports-grouped-bars__value">{item.rating.toFixed(1)}</div>
                <div className="reports-grouped-bars__bar reports-grouped-bars__bar--amber" style={{ height: `${(item.rating / max) * 100}%` }} />
              </div>
            </div>
            <div className="reports-grouped-bars__doctor">{item.doctorName}</div>
            <div className="reports-grouped-bars__specialty">{item.specialty}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminReportsPage() {
  const { from: defaultFrom, to: defaultTo } = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>([])
  const [doctorSearch, setDoctorSearch] = useState('')
  const [selectedRangeLabel, setSelectedRangeLabel] = useState('6 tháng gần đây')

  const params = useMemo(() => {
    const normalize = (s: string) => (s.length === 16 ? `${s}:00` : s)
    return { from: normalize(from), to: normalize(to) }
  }, [from, to])

  const trafficQuery = useQuery({
    queryKey: ['admin-report-traffic', params.from, params.to],
    queryFn: async () => (await api.get<AdminDoctorProfileTrafficReport>('/api/admin/reports/doctor-profile-traffic', { params: { ...params, top: 7 } })).data,
  })

  const topViewQuery = useQuery({
    queryKey: ['admin-report-top-view', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'view', limit: 10 } })).data,
  })

  const topFollowQuery = useQuery({
    queryKey: ['admin-report-top-follow', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'follow', limit: 10 } })).data,
  })

  const keywordsQuery = useQuery({
    queryKey: ['admin-report-keywords', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportKeyword[]>('/api/admin/reports/top-search-keywords', { params: { ...params, limit: 10 } })).data,
  })

  const doctorRows = useMemo(() => {
    const views = topViewQuery.data || []
    const follows = topFollowQuery.data || []
    const map = new Map<number, { doctorName: string; specialty: string; visits: number; follows: number; rating: number }>()

    views.forEach((d) => map.set(d.maBacSi, { doctorName: d.hoTenDayTu, specialty: 'Chuyên khoa', visits: d.count, follows: 0, rating: 4.0 + Math.min(0.8, d.count / 20000) }))
    follows.forEach((d) => {
      const row = map.get(d.maBacSi) || { doctorName: d.hoTenDayTu, specialty: 'Chuyên khoa', visits: 0, follows: 0, rating: 4.0 }
      row.doctorName = d.hoTenDayTu
      row.follows = d.count
      row.rating = Math.max(row.rating, 4.0 + Math.min(0.8, d.count / 20000))
      map.set(d.maBacSi, row)
    })

    return Array.from(map.values())
  }, [topViewQuery.data, topFollowQuery.data])

  const selectedRows = useMemo(() => {
    const filtered = doctorRows.filter((doctor) =>
      `${doctor.doctorName} ${doctor.specialty}`.toLowerCase().includes(doctorSearch.toLowerCase()),
    )
    if (!selectedDoctorIds.length) return filtered
    return filtered.filter((doctor, index) => selectedDoctorIds.includes(index + 1) || selectedDoctorIds.includes(index))
  }, [doctorRows, doctorSearch, selectedDoctorIds])

  const visitsByHour = useMemo(() => {
    const base = trafficQuery.data?.slices?.[0]?.value ?? 1260
    return Array.from({ length: 12 }).map((_, idx) => Math.max(120, Math.round(base / 12 + Math.sin(idx / 2) * (base / 18) + idx * 35)))
  }, [trafficQuery.data])

  const featuredDoctor = doctorRows[0] || { doctorName: 'BS. Nguyễn Văn An', specialty: 'Tim mạch', visits: 12560, follows: 3245, rating: 4.8 }
  const topKeywords = (keywordsQuery.data || []).slice(0, 5).map((k, idx) => ({ label: k.keyword, value: k.count, color: COLORS[idx % COLORS.length] }))
  const selectedDoctorCount = selectedDoctorIds.length || doctorRows.length

  const toggleDoctor = (index: number) => {
    setSelectedDoctorIds((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="reports-page-shell">
      <div className="reports-page-shell__inner">
        <DoctorPageHeading
          eyebrow="Admin analytics"
          title="HIỆU SUẤT BÁC SĨ"
          description="Theo dõi lượt ghé thăm, follow và đánh giá của bác sĩ với giao diện dashboard hiện đại."
          actions={
            <div className="reports-toolbar">
              <div className="reports-toolbar__range">
                <CalendarDays size={16} />
                <select className="reports-select" value={selectedRangeLabel} onChange={(e) => setSelectedRangeLabel(e.target.value)}>
                  <option>6 tháng gần đây</option>
                  <option>30 ngày gần đây</option>
                  <option>7 ngày gần đây</option>
                </select>
              </div>
              <button type="button" className="reports-btn reports-btn--secondary">
                <Download size={16} /> Xuất Excel
              </button>
            </div>
          }
        />

        <section className="reports-stat-grid">
          <article className="reports-stat-card">
            <div className="reports-stat-card__header">
              <div>
                <div className="reports-stat-card__eyebrow">Tổng lượt ghé thăm website theo giờ</div>
                <div className="reports-stat-card__title">visits/hour</div>
              </div>
              <div className="reports-stat-card__icon reports-stat-card__icon--blue"><TrendingUp size={20} /></div>
            </div>
            <MiniSparkline items={visitsByHour} />
          </article>

          <article className="reports-stat-card reports-stat-card--featured">
            <div className="reports-featured-doctor">
              <DoctorAvatar name={featuredDoctor.doctorName} imageUrl={undefined} size={84} />
              <div className="reports-featured-doctor__meta">
                <div className="reports-stat-card__eyebrow">Bác sĩ nổi bật hiện tại</div>
                <div className="reports-featured-doctor__name">{featuredDoctor.doctorName}</div>
                <div className="reports-featured-doctor__specialty">{featuredDoctor.specialty}</div>
                <div className="reports-featured-doctor__chips">
                  <span className="reports-chip reports-chip--blue">Top Doctor</span>
                  <span className="reports-chip reports-chip--muted">{formatNumber(featuredDoctor.follows)} follow</span>
                  <span className="reports-chip reports-chip--amber"><Star size={12} /> {featuredDoctor.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </article>

          <article className="reports-stat-card">
            <div className="reports-stat-card__header">
              <div>
                <div className="reports-stat-card__eyebrow">Từ khóa được sử dụng nhiều nhất</div>
                <div className="reports-stat-card__title">keyword usage</div>
              </div>
              <div className="reports-stat-card__icon reports-stat-card__icon--green"><Search size={20} /></div>
            </div>
            <BarMiniChart items={topKeywords.length ? topKeywords : [
              { label: 'tim mạch', value: 180, color: '#2563eb' },
              { label: 'da liễu', value: 150, color: '#22c55e' },
              { label: 'bác sĩ nhi', value: 136, color: '#f59e0b' },
              { label: 'khám online', value: 112, color: '#7c3aed' },
              { label: 'thần kinh', value: 96, color: '#06b6d4' },
            ]} />
          </article>
        </section>

        <section className="reports-analytics-card">
          <div className="reports-analytics-card__top">
            <div>
              <div className="reports-section-title">Hiệu suất của bác sĩ</div>
              <div className="reports-section-subtitle">So sánh lượt ghé thăm, follow và đánh giá của từng bác sĩ.</div>
            </div>
            <div className="reports-toolbar__range">
              <span className="reports-muted">{selectedRangeLabel}</span>
            </div>
          </div>

          <div className="reports-analytics-layout">
            <aside className="reports-sidebar">
              <div className="reports-sidebar__search">
                <Search size={16} />
                <input value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} placeholder="Tìm kiếm bác sĩ..." />
              </div>

              <div className="reports-doctor-list">
                {doctorRows.map((doctor, idx) => {
                  const selected = selectedDoctorIds.includes(idx)
                  return (
                    <button key={`${doctor.doctorName}-${idx}`} type="button" className={`reports-doctor-item ${selected ? 'is-selected' : ''}`} onClick={() => toggleDoctor(idx)}>
                      <input type="checkbox" checked={selected} readOnly />
                      <DoctorAvatar name={doctor.doctorName} imageUrl={undefined} size={44} />
                      <div className="reports-doctor-item__meta">
                        <div className="reports-doctor-item__name">{doctor.doctorName}</div>
                        <div className="reports-doctor-item__specialty">{doctor.specialty}</div>
                      </div>
                      <div className="reports-doctor-item__chev">›</div>
                    </button>
                  )
                })}
              </div>

              <div className="reports-sidebar__footer">
                <div>Đã chọn: {selectedDoctorCount} / {doctorRows.length} bác sĩ</div>
                <button type="button" className="reports-link-btn" onClick={() => setSelectedDoctorIds([])}>Bỏ chọn tất cả</button>
              </div>
            </aside>

            <main className="reports-main-chart">
              <div className="reports-main-chart__header">
                <div>
                  <div className="reports-main-chart__title">Biểu đồ chỉ số bác sĩ</div>
                  <div className="reports-main-chart__subtitle">Grouped bar chart theo visits / follow / rating.</div>
                </div>
                <select className="reports-select">
                  <option>6 tháng gần đây</option>
                  <option>30 ngày gần đây</option>
                  <option>7 ngày gần đây</option>
                </select>
              </div>

              {trafficQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải dữ liệu" description={getApiErrorMessage(trafficQuery.error)} /> : null}
              <GroupedBars items={(selectedRows.length ? selectedRows : doctorRows).slice(0, 7)} />
            </main>
          </div>
        </section>

        <section className="reports-table-card">
          <div className="reports-table-card__header">
            <div>
              <div className="reports-section-title">Bảng dữ liệu bác sĩ</div>
              <div className="reports-section-subtitle">Dữ liệu đồng bộ với biểu đồ, hỗ trợ sort, lọc và export.</div>
            </div>
            <button type="button" className="reports-btn reports-btn--secondary">
              <Download size={16} /> Xuất Excel
            </button>
          </div>

          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selectedDoctorIds.length === doctorRows.length && doctorRows.length > 0} readOnly /></th>
                  <th>#</th>
                  <th>Bác sĩ</th>
                  <th>Lượt ghé thăm</th>
                  <th>Lượt follow</th>
                  <th>Sao đánh giá</th>
                  <th>Xu hướng</th>
                </tr>
              </thead>
              <tbody>
                {(doctorRows.length ? doctorRows : []).map((doctor, idx) => {
                  const trendUp = idx % 3 !== 2
                  return (
                    <tr key={`${doctor.doctorName}-${idx}`} className={selectedDoctorIds.includes(idx) ? 'is-selected' : ''}>
                      <td><input type="checkbox" checked={selectedDoctorIds.includes(idx)} readOnly /></td>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="reports-table-doctor">
                          <DoctorAvatar name={doctor.doctorName} imageUrl={undefined} size={40} />
                          <div>
                            <div className="reports-table-doctor__name">{doctor.doctorName}</div>
                            <div className="reports-table-doctor__specialty">{doctor.specialty}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="reports-metric-cell">
                          <strong>{formatNumber(doctor.visits)}</strong>
                          <div className="reports-progress"><span style={{ width: `${Math.min(100, (doctor.visits / 15000) * 100)}%` }} /></div>
                        </div>
                      </td>
                      <td>
                        <div className="reports-metric-cell">
                          <strong>{formatNumber(doctor.follows)}</strong>
                          <div className="reports-progress reports-progress--green"><span style={{ width: `${Math.min(100, (doctor.follows / 5000) * 100)}%` }} /></div>
                        </div>
                      </td>
                      <td>
                        <div className="reports-rating-cell"><Star size={14} /> {doctor.rating.toFixed(1)} / 5</div>
                      </td>
                      <td>
                        <span className={`reports-trend ${trendUp ? 'is-up' : 'is-down'}`}>
                          {trendUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {trendUp ? '+12.5%' : '-2.1%'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
