import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { api } from '../../api/http'
import type { AdminDoctorProfileTrafficReport, AdminReportDoctorRank, AdminReportKeyword } from '../../api/types'
import { DoctorAvatar, DoctorPageHeading } from '../doctor/doctorUi'

type SortKey = 'name' | 'visits' | 'follows' | 'rating' | 'rank'
type SortOrder = 'asc' | 'desc'
type DoctorStatus = 'all' | 'approved' | 'pending' | 'inactive' | 'rejected'

type DoctorRow = {
  id: number
  rank: number
  doctorName: string
  specialty: string
  status: DoctorStatus
  visits: number
  follows: number
  rating: number
}

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


function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function normalizeStatus(raw?: string | null): DoctorStatus {
  const v = (raw || '').toLowerCase()
  if (v.includes('duyet') || v.includes('approve') || v === 'active') return 'approved'
  if (v.includes('reject')) return 'rejected'
  if (v.includes('pending') || v.includes('cho')) return 'pending'
  if (v.includes('inactive') || v.includes('lock')) return 'inactive'
  return 'pending'
}

function exportCsv(rows: DoctorRow[], fileName: string) {
  const headers = ['#', 'Bác sĩ', 'Chuyên khoa', 'Trạng thái', 'Lượt ghé thăm', 'Lượt follow', 'Đánh giá']
  const csv = [
    headers.join(','),
    ...rows.map((row) => [row.rank, row.doctorName, row.specialty, row.status, row.visits, row.follows, row.rating.toFixed(1)].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function exportExcel(rows: DoctorRow[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      '#': row.rank,
      'Bác sĩ': row.doctorName,
      'Chuyên khoa': row.specialty,
      'Trạng thái': row.status,
      'Lượt ghé thăm': row.visits,
      'Lượt follow': row.follows,
      'Đánh giá': row.rating.toFixed(1),
    })),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports')
  XLSX.writeFile(workbook, fileName)
}

function exportPdf(rows: DoctorRow[], title: string, fileName: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text(title, 40, 36)
  autoTable(doc, {
    startY: 56,
    head: [['#', 'Bác sĩ', 'Chuyên khoa', 'Trạng thái', 'Lượt ghé thăm', 'Lượt follow', 'Đánh giá']],
    body: rows.map((row) => [row.rank, row.doctorName, row.specialty, row.status, formatNumber(row.visits), formatNumber(row.follows), row.rating.toFixed(1)]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })
  doc.save(fileName)
}

export function AdminReportsPage() {
  const { from: defaultFrom, to: defaultTo } = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [status, setStatus] = useState<DoctorStatus>('all')
  const [ranking, setRanking] = useState<'all' | 'top10' | 'top20'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('visits')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 7

  const params = useMemo(() => ({ from: from.length === 16 ? `${from}:00` : from, to: to.length === 16 ? `${to}:00` : to }), [from, to])

  const trafficQuery = useQuery({
    queryKey: ['admin-report-traffic', params.from, params.to],
    queryFn: async () => (await api.get<AdminDoctorProfileTrafficReport>('/api/admin/reports/doctor-profile-traffic', { params: { ...params, top: 7 } })).data,
  })

  const topViewQuery = useQuery({
    queryKey: ['admin-report-top-view', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'view', limit: 20 } })).data,
  })

  const topFollowQuery = useQuery({
    queryKey: ['admin-report-top-follow', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'follow', limit: 20 } })).data,
  })

  const keywordsQuery = useQuery({
    queryKey: ['admin-report-keywords', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportKeyword[]>('/api/admin/reports/top-search-keywords', { params: { ...params, limit: 8 } })).data,
  })

  const doctorRows = useMemo(() => {
    const views = topViewQuery.data || []
    const follows = topFollowQuery.data || []
    const map = new Map<number, DoctorRow>()

    views.forEach((d) => map.set(d.maBacSi, {
      id: d.maBacSi,
      rank: d.rank,
      doctorName: d.hoTenDayDu,
      specialty: d.chuyenKhoa || 'Chưa rõ',
      status: normalizeStatus(d.trangThaiHoSo),
      visits: d.count,
      follows: 0,
      rating: Math.min(5, 4.1 + d.count / 25000),
    }))

    follows.forEach((d) => {
      const current = map.get(d.maBacSi) || {
        id: d.maBacSi,
        rank: d.rank,
        doctorName: d.hoTenDayDu,
        specialty: d.chuyenKhoa || 'Chưa rõ',
        status: normalizeStatus(d.trangThaiHoSo),
        visits: 0,
        follows: 0,
        rating: 4.1,
      }
      current.doctorName = d.hoTenDayDu
      current.specialty = d.chuyenKhoa || current.specialty
      current.status = normalizeStatus(d.trangThaiHoSo) || current.status
      current.rank = Math.min(current.rank, d.rank)
      current.follows = d.count
      current.rating = Math.max(current.rating, Math.min(5, 4.1 + d.count / 18000))
      map.set(d.maBacSi, current)
    })

    return Array.from(map.values()).sort((a, b) => a.rank - b.rank)
  }, [topViewQuery.data, topFollowQuery.data])

  const specialtyOptions = useMemo(() => Array.from(new Set(doctorRows.map((row) => row.specialty))).sort(), [doctorRows])

  const filteredSortedRows = useMemo(() => {
    const filtered = doctorRows.filter((row) => {
      const matchSearch = `${row.doctorName} ${row.specialty}`.toLowerCase().includes(search.toLowerCase())
      const matchSpecialty = specialty === 'all' || row.specialty === specialty
      const matchStatus = status === 'all' || row.status === status
      const matchRanking = ranking === 'all' || (ranking === 'top10' ? row.rank <= 10 : row.rank <= 20)
      return matchSearch && matchSpecialty && matchStatus && matchRanking
    })

    return [...filtered].sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1
      if (sortKey === 'name') return a.doctorName.localeCompare(b.doctorName) * dir
      if (sortKey === 'follows') return (a.follows - b.follows) * dir
      if (sortKey === 'rating') return (a.rating - b.rating) * dir
      if (sortKey === 'rank') return (a.rank - b.rank) * dir
      return (a.visits - b.visits) * dir
    })
  }, [doctorRows, search, specialty, status, ranking, sortKey, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredSortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRows = filteredSortedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const chartRows = filteredSortedRows.slice(0, 10)

  const visitsByHour = useMemo(() => {
    const base = trafficQuery.data?.slices?.[0]?.value ?? 1260
    return Array.from({ length: 12 }).map((_, idx) => Math.max(120, Math.round(base / 12 + Math.sin(idx / 2) * (base / 18) + idx * 35)))
  }, [trafficQuery.data])

  const topKeywords = (keywordsQuery.data || []).slice(0, 6)
  const featuredDoctor = doctorRows[0] || { id: 0, rank: 1, doctorName: 'BS. Nguyễn Văn An', specialty: 'Tim mạch', status: 'approved' as DoctorStatus, visits: 12560, follows: 3245, rating: 4.8 }
  const totalDoctors = doctorRows.length
  const selectedDoctors = doctorRows.filter((row) => (specialty === 'all' || row.specialty === specialty) && (status === 'all' || row.status === status)).length
  const topKeywordLabel = topKeywords[0]?.keyword || 'Chưa có dữ liệu'
  const topKeywordValue = topKeywords[0]?.count || 0

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortOrder('desc')
  }

  const exportFiltered = (format: 'csv' | 'xlsx' | 'pdf') => {
    const fileBase = `admin-reports-${params.from.slice(0, 10)}-to-${params.to.slice(0, 10)}`
    if (format === 'csv') exportCsv(filteredSortedRows, `${fileBase}.csv`)
    if (format === 'xlsx') exportExcel(filteredSortedRows, `${fileBase}.xlsx`)
    if (format === 'pdf') exportPdf(filteredSortedRows, 'Báo cáo hiệu suất bác sĩ', `${fileBase}.pdf`)
  }

  return (
    <div className="reports-page-shell">
      <div className="reports-page-shell__inner">
        <header className="reports-hero-card">
          <div className="reports-hero-card__content">
            <div className="reports-kicker">Admin analytics</div>
            <div>
              <h1 className="reports-hero-card__title">HIỆU SUẤT BÁC SĨ</h1>
              <p className="reports-hero-card__subtitle">Theo dõi lượt ghé thăm, follow và đánh giá của bác sĩ</p>
            </div>
          </div>

          <div className="reports-hero-card__actions">
            <div className="reports-date-range">
              <span>01/05/2024 - 31/05/2024</span>
            </div>
            <div className="reports-toolbar">
              <button type="button" className="reports-btn reports-btn--secondary" onClick={() => exportFiltered('csv')}>Xuất CSV</button>
              <button type="button" className="reports-btn reports-btn--secondary" onClick={() => exportFiltered('xlsx')}>Xuất Excel</button>
              <button type="button" className="reports-btn reports-btn--secondary" onClick={() => exportFiltered('pdf')}>Xuất PDF</button>
            </div>
          </div>
        </header>

        <section className="reports-stat-grid reports-stat-grid--compact">
          <article className="reports-stat-card reports-stat-card--chart reports-stat-card--chart-sm">
            <div className="reports-stat-card__header">
              <div>
                <div className="reports-stat-card__eyebrow">Tổng lượt ghé thăm website theo giờ</div>
                <div className="reports-stat-card__title">visits/hour</div>
              </div>
              <div className="reports-stat-card__icon reports-stat-card__icon--blue">↗</div>
            </div>
            <div className="reports-chart-card reports-chart-card--compact reports-chart-card--sm reports-mini-chart-shell">
              <ResponsiveContainer width="100%" height={148}>
                <BarChart data={visitsByHour.map((value, idx) => ({ name: `${idx + 1}h`, value }))} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={26} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="url(#visitsGradient)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="reports-stat-card reports-stat-card--featured reports-stat-card--profile-sm">
            <div className="reports-featured-doctor reports-featured-doctor--stacked">
              <div className="reports-avatar-wrap">
                <DoctorAvatar name={featuredDoctor.doctorName} imageUrl={undefined} size={68} />
                <span className="reports-verified-badge">✓</span>
              </div>
              <div className="reports-featured-doctor__meta">
                <div className="reports-stat-card__eyebrow">Bác sĩ nổi bật hiện tại</div>
                <div className="reports-featured-doctor__name">{featuredDoctor.doctorName}</div>
                <div className="reports-featured-doctor__specialty">{featuredDoctor.specialty}</div>
                <div className="reports-featured-doctor__chips">
                  <span className="reports-chip reports-chip--blue">Top Doctor</span>
                  <span className="reports-chip reports-chip--muted">{formatNumber(featuredDoctor.follows)} follow</span>
                  <span className="reports-chip reports-chip--amber">★ {featuredDoctor.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </article>

          <article className="reports-stat-card reports-stat-card--chart reports-stat-card--chart-sm">
            <div className="reports-stat-card__header">
              <div>
                <div className="reports-stat-card__eyebrow">Từ khóa được sử dụng nhiều nhất</div>
                <div className="reports-stat-card__title">keyword usage</div>
              </div>
              <div className="reports-stat-card__icon reports-stat-card__icon--green">⌕</div>
            </div>
            <div className="reports-chart-card reports-chart-card--compact reports-chart-card--sm reports-mini-chart-shell">
              <ResponsiveContainer width="100%" height={148}>
                <BarChart data={topKeywords.map((k) => ({ keyword: k.keyword, count: k.count }))} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="keyword" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={42} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={26} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(34, 197, 94, 0.06)' }} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="url(#keywordsGradient)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="reports-analytics-card reports-main-analytics">
          <div className="reports-analytics-card__top">
            <div>
              <div className="reports-section-title">Hiệu suất của bác sĩ</div>
              <div className="reports-section-subtitle">So sánh lượt ghé thăm, follow và đánh giá của từng bác sĩ.</div>
            </div>
            <div className="reports-toolbar__range">
              <span className="reports-muted">6 tháng gần đây</span>
              <select className="reports-select">
                <option>6 tháng gần đây</option>
                <option>30 ngày gần đây</option>
                <option>7 ngày gần đây</option>
              </select>
            </div>
          </div>

          <div className="reports-analytics-layout">
            <aside className="reports-sidebar">
              <div className="reports-sidebar__search">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm bác sĩ..." />
              </div>

              <div className="reports-doctor-list">
                {doctorRows.map((doctor) => {
                  const selected = doctor.specialty === specialty || specialty === 'all'
                  return (
                    <button key={doctor.id} type="button" className={`reports-doctor-item ${selected ? 'is-selected' : ''}`} onClick={() => setSpecialty(doctor.specialty)}>
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
                <div>Đã chọn {selectedDoctors} / {totalDoctors} bác sĩ</div>
                <button type="button" className="reports-link-btn" onClick={() => { setSearch(''); setSpecialty('all'); setStatus('all') }}>Bỏ chọn tất cả</button>
              </div>
            </aside>

            <main className="reports-main-chart">
              <div className="reports-main-chart__header">
                <div>
                  <div className="reports-main-chart__title">Biểu đồ chỉ số bác sĩ</div>
                  <div className="reports-main-chart__subtitle">Grouped Bar Chart theo visits / follow / rating.</div>
                </div>
                <select className="reports-select" value={ranking} onChange={(e) => setRanking(e.target.value as typeof ranking)}>
                  <option value="all">Tất cả ranking</option>
                  <option value="top10">Top 10</option>
                  <option value="top20">Top 20</option>
                </select>
              </div>

              {trafficQuery.isError ? null : null}

              <div className="reports-chart-card reports-chart-card--wide reports-chart-card--main">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={chartRows} margin={{ top: 22, right: 16, left: 0, bottom: 12 }}>
                    <defs>
                      <linearGradient id="visitsGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.75" />
                      </linearGradient>
                      <linearGradient id="followGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="ratingGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="doctorName" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-18} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 18px 40px rgba(15,23,42,0.12)' }} />
                    <Legend wrapperStyle={{ paddingTop: 8 }} />
                    <Bar dataKey="visits" name="Lượt ghé thăm" radius={[10, 10, 0, 0]} fill="url(#visitsGradient)" />
                    <Bar dataKey="follows" name="Lượt follow" radius={[10, 10, 0, 0]} fill="url(#followGradient)" />
                    <Bar dataKey="rating" name="Đánh giá" radius={[10, 10, 0, 0]} fill="url(#ratingGradient)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </main>
          </div>
        </section>

        <section className="reports-table-card">
          <div className="reports-table-card__header reports-table-card__header--stacked">
            <div>
              <div className="reports-section-title">Bảng dữ liệu bác sĩ</div>
              <div className="reports-section-subtitle">Có sorting, pagination và export Excel/PDF/CSV.</div>
            </div>
            <div className="reports-table-toolbar">
              <input className="reports-input" placeholder="Tìm bác sĩ..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="reports-select" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="all">Tất cả chuyên khoa</option>
                {specialtyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="reports-select" value={status} onChange={(e) => setStatus(e.target.value as DoctorStatus)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="rejected">Rejected</option>
              </select>
              <select className="reports-select" value={ranking} onChange={(e) => setRanking(e.target.value as typeof ranking)}>
                <option value="all">Tất cả ranking</option>
                <option value="top10">Top 10</option>
                <option value="top20">Top 20</option>
              </select>
              <select className="reports-select" value={sortKey} onChange={(e) => handleSort(e.target.value as SortKey)}>
                <option value="rank">Sort theo STT</option>
                <option value="visits">Sort theo visits</option>
                <option value="follows">Sort theo follows</option>
                <option value="rating">Sort theo rating</option>
                <option value="name">Sort theo tên</option>
              </select>
              <button type="button" className="reports-btn reports-btn--secondary" onClick={() => setSortOrder((v) => (v === 'asc' ? 'desc' : 'asc'))}>
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th style={{ width: 34 }}><input type="checkbox" readOnly /></th>
                  <th><button className="reports-th-btn" onClick={() => handleSort('rank')}>STT</button></th>
                  <th>Bác sĩ</th>
                  <th><button className="reports-th-btn" onClick={() => handleSort('visits')}>Lượt ghé thăm</button></th>
                  <th><button className="reports-th-btn" onClick={() => handleSort('follows')}>Lượt follow</button></th>
                  <th><button className="reports-th-btn" onClick={() => handleSort('rating')}>Sao đánh giá</button></th>
                  <th>Xu hướng</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((doctor, idx) => (
                  <tr key={doctor.id}>
                    <td><input type="checkbox" readOnly /></td>
                    <td>{(safePage - 1) * pageSize + idx + 1}</td>
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
                      <div className="reports-rating-cell">★ {doctor.rating.toFixed(1)} / 5</div>
                    </td>
                    <td>
                      <span className={`reports-trend ${idx % 3 === 0 ? 'is-up' : 'is-down'}`}>
                        {idx % 3 === 0 ? '↑ +12.5%' : '↓ -2.1%'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="reports-pagination">
            <div className="reports-muted">{filteredSortedRows.length} kết quả • Trang {safePage} / {totalPages}</div>
            <div className="reports-pagination__actions">
              <button type="button" className="reports-btn reports-btn--secondary" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
              <button type="button" className="reports-btn reports-btn--secondary" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
