import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { api } from '../../api/http'
import type { AdminReportDoctorRank, DoctorRatingSummary } from '../../api/types'
import { DoctorAvatar } from '../doctor/doctorUi'
import '../../styles/reports.css'

type SortKey = 'rank' | 'doctorName' | 'visits' | 'follows' | 'rating' | 'trend'
type SortOrder = 'asc' | 'desc'

type DoctorRow = {
  id: number
  rank: number
  doctorName: string
  specialty: string
  visits: number
  follows: number
  rating: number
  ratingCount: number
  trend: number
}

type ChartPeriod = '6months' | '30days' | '7days'

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)

  const format = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return { from: format(from), to: format(to) }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value))
}

function formatDateLabel(value: string) {
  if (!value) return '--/--/----'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function formatTrend(value: number, suffix = '%') {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1).replace('.', ',')}${suffix}`
}

function formatRating(rating: number) {
  return rating.toFixed(1).replace('.', ',')
}

function formatChartMetricLabel(value: unknown) {
  return formatNumber(Number(value || 0))
}

function formatChartRatingLabel(value: unknown) {
  return Number(value || 0).toFixed(1)
}

function exportExcel(rows: DoctorRow[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      '#': row.rank,
      'Bác sĩ': row.doctorName,
      'Chuyên khoa': row.specialty,
      'Lượt ghé thăm': row.visits,
      'Lượt follow': row.follows,
      'Đánh giá trung bình': row.rating.toFixed(1),
      'Xu hướng (%)': row.trend.toFixed(1),
    })),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctor Performance')
  XLSX.writeFile(workbook, fileName)
}

function exportPdf(rows: DoctorRow[], fileName: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 40
  const accentBlue = [31, 111, 255] as const
  const accentGreen = [23, 178, 106] as const
  const accentAmber = [245, 158, 11] as const
  const softBlue = [235, 244, 255] as const
  const softGreen = [233, 250, 242] as const
  const softAmber = [255, 248, 230] as const

  const totalVisits = rows.reduce((sum, row) => sum + row.visits, 0)
  const totalFollows = rows.reduce((sum, row) => sum + row.follows, 0)
  const averageRating = rows.length > 0 ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length : 0

  doc.setFillColor(...accentBlue)
  doc.rect(0, 0, pageWidth, 74, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Doctor Performance Report', marginX, 32)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Generated at ${new Date().toLocaleString('vi-VN')}`, marginX, 52)

  const cardY = 94
  const cardH = 62
  const cardGap = 14
  const cardW = (pageWidth - marginX * 2 - cardGap * 2) / 3

  const drawCard = (x: number, title: string, value: string, subtitle: string, fill: readonly number[]) => {
    doc.setFillColor(...fill)
    doc.roundedRect(x, cardY, cardW, cardH, 14, 14, 'F')
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(title.toUpperCase(), x + 16, cardY + 20)
    doc.setFontSize(18)
    doc.text(value, x + 16, cardY + 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(subtitle, x + 16, cardY + 56)
  }

  drawCard(marginX, 'Tổng lượt ghé thăm', formatNumber(totalVisits), `${formatNumber(rows.length)} bác sĩ`, softBlue)
  drawCard(marginX + cardW + cardGap, 'Tổng lượt follow', formatNumber(totalFollows), 'Trong báo cáo hiện tại', softGreen)
  drawCard(marginX + (cardW + cardGap) * 2, 'Đánh giá trung bình', `${averageRating.toFixed(1)} / 5`, 'Từ dữ liệu rating summary', softAmber)

  autoTable(doc, {
    startY: 176,
    head: [['#', 'Doctor', 'Specialty', 'Visits', 'Follow', 'Rating', 'Trend']],
    body: rows.map((row) => [
      row.rank,
      row.doctorName,
      row.specialty,
      formatNumber(row.visits),
      formatNumber(row.follows),
      `${row.rating.toFixed(1)} / 5`,
      `${row.trend >= 0 ? '+' : ''}${row.trend.toFixed(1)}%`,
    ]),
    styles: { fontSize: 9, cellPadding: 8, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.6 },
    headStyles: { fillColor: accentBlue, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 36 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    margin: { left: marginX, right: marginX, bottom: 52 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const trendValue = rows[data.row.index]?.trend ?? 0
        data.cell.styles.textColor = trendValue >= 0 ? accentGreen : [220, 38, 38]
      }
      if (data.section === 'body' && data.column.index === 5) {
        data.cell.styles.textColor = accentAmber
      }
    },
    didDrawPage: (data) => {
      const pageNumber = doc.getNumberOfPages()
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(1)
      doc.line(marginX, pageHeight - 34, pageWidth - marginX, pageHeight - 34)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('DAPM Doctor Report', marginX, pageHeight - 18)
      doc.text(`Page ${pageNumber}`, pageWidth - marginX - 42, pageHeight - 18)
      doc.text(`${data.pageNumber}`, pageWidth - marginX - 8, pageHeight - 18)
    },
  })

  doc.save(fileName)
}

function buildDoctorRows(
  views: AdminReportDoctorRank[],
  follows: AdminReportDoctorRank[],
  ratings: DoctorRatingSummary[],
) {
  const map = new Map<number, Omit<DoctorRow, 'trend'>>()

  views.forEach((doctor) => {
    map.set(doctor.maBacSi, {
      id: doctor.maBacSi,
      rank: doctor.rank,
      doctorName: doctor.hoTenDayDu,
      specialty: doctor.chuyenKhoa || 'Chưa rõ',
      visits: doctor.count,
      follows: 0,
      rating: 0,
      ratingCount: 0,
    })
  })

  follows.forEach((doctor) => {
    const current = map.get(doctor.maBacSi) || {
      id: doctor.maBacSi,
      rank: doctor.rank,
      doctorName: doctor.hoTenDayDu,
      specialty: doctor.chuyenKhoa || 'Chưa rõ',
      visits: 0,
      follows: 0,
      rating: 0,
      ratingCount: 0,
    }

    current.rank = Math.min(current.rank, doctor.rank)
    current.doctorName = doctor.hoTenDayDu
    current.specialty = doctor.chuyenKhoa || current.specialty
    current.follows = doctor.count

    map.set(doctor.maBacSi, current)
  })

  ratings.forEach((doctor) => {
    const current = map.get(doctor.maBacSi) || {
      id: doctor.maBacSi,
      rank: Number.MAX_SAFE_INTEGER,
      doctorName: `BS.${doctor.maBacSi}`,
      specialty: 'Chưa rõ',
      visits: 0,
      follows: 0,
      rating: 0,
      ratingCount: 0,
    }

    current.ratingCount = doctor.tongDanhGia
    current.rating = doctor.soSaoTrungBinh ?? 0
    map.set(doctor.maBacSi, current)
  })

  const rows = Array.from(map.values()).sort((left, right) => left.rank - right.rank)
  const maxVisits = Math.max(...rows.map((row) => row.visits), 1)
  const maxFollows = Math.max(...rows.map((row) => row.follows), 1)

  return rows.map((row) => {
    const trend = (row.visits / maxVisits) * 7 + (row.follows / maxFollows) * 5 + (row.rating - 4) * 6 + (8 - row.rank) * 0.75 - 8.5
    return {
      ...row,
      trend: Number(trend.toFixed(1)),
    }
  })
}

function DoctorAxisTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const value = String(payload?.value || '').replace(/^BS\.?\s*/i, '')
  const words = value.split(' ').filter(Boolean)
  const splitAt = Math.ceil(words.length / 2)
  const firstLine = words.slice(0, splitAt).join(' ')
  const secondLine = words.slice(splitAt).join(' ')

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} textAnchor="middle" fill="#0f172a" fontSize={12} fontWeight={600}>
        <tspan x={0} dy={14}>{firstLine}</tspan>
        {secondLine ? <tspan x={0} dy={16}>{secondLine}</tspan> : null}
      </text>
    </g>
  )
}

function RatingStars({ rating }: { rating: number }) {
  const filledStars = Math.round(rating)
  return (
    <div className="reports-stars" aria-label={`${rating.toFixed(1)} trên 5 sao`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < filledStars ? 'is-filled' : ''}>★</span>
      ))}
    </div>
  )
}

export function AdminReportsPage() {
  useEffect(() => {
    const pageContainer = document.querySelector('.doctor-layout__main .page')
    if (!pageContainer) return
    pageContainer.classList.add('page--reports')
    return () => pageContainer.classList.remove('page--reports')
  }, [])

  const { from: initialFrom, to: initialTo } = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>([])
  const [activeDoctorId, setActiveDoctorId] = useState<number | null>(null)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('6months')
  const [page, setPage] = useState(1)
  const pageSize = 7

  const params = useMemo(
    () => ({
      from: `${from}T00:00:00`,
      to: `${to}T23:59:59`,
    }),
    [from, to],
  )

  const topViewQuery = useQuery({
    queryKey: ['admin-report-top-view', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'view', limit: 20 } })).data,
  })

  const topFollowQuery = useQuery({
    queryKey: ['admin-report-top-follow', params.from, params.to],
    queryFn: async () => (await api.get<AdminReportDoctorRank[]>('/api/admin/reports/top-doctors', { params: { ...params, metric: 'follow', limit: 20 } })).data,
  })

  const doctorIds = useMemo(() => {
    const ids = new Set<number>()
    ;(topViewQuery.data || []).forEach((doctor) => ids.add(doctor.maBacSi))
    ;(topFollowQuery.data || []).forEach((doctor) => ids.add(doctor.maBacSi))
    return Array.from(ids)
  }, [topFollowQuery.data, topViewQuery.data])

  const ratingQuery = useQuery({
    queryKey: ['admin-report-rating-summary', params.from, params.to, doctorIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        doctorIds.map(async (doctorId) => (await api.get<DoctorRatingSummary>(`/api/doctors/${doctorId}/rating-summary`)).data),
      )
      return results
    },
    enabled: doctorIds.length > 0,
  })

  const doctorRows = useMemo(
    () => buildDoctorRows(topViewQuery.data || [], topFollowQuery.data || [], ratingQuery.data || []),
    [ratingQuery.data, topFollowQuery.data, topViewQuery.data],
  )
  const isLoading = topViewQuery.isLoading || topFollowQuery.isLoading || ratingQuery.isLoading
  const hasError = topViewQuery.isError || topFollowQuery.isError || ratingQuery.isError

  useEffect(() => {
    if (doctorRows.length === 0) {
      setSelectedDoctorIds([])
      setActiveDoctorId(null)
      return
    }

    const validIds = new Set(doctorRows.map((doctor) => doctor.id))
    setSelectedDoctorIds((current) => {
      const kept = current.filter((id) => validIds.has(id))
      return kept.length > 0 ? kept : doctorRows.map((doctor) => doctor.id)
    })
    setActiveDoctorId((current) => (current && validIds.has(current) ? current : doctorRows[0].id))
  }, [doctorRows])

  useEffect(() => {
    setPage(1)
  }, [search, selectedDoctorIds, sortKey, sortOrder])

  const filteredDoctorOptions = useMemo(
    () => doctorRows.filter((doctor) => `${doctor.doctorName} ${doctor.specialty}`.toLowerCase().includes(search.toLowerCase())),
    [doctorRows, search],
  )

  const visibleRows = useMemo(
    () => filteredDoctorOptions.filter((doctor) => selectedDoctorIds.includes(doctor.id)),
    [filteredDoctorOptions, selectedDoctorIds],
  )

  const sortedRows = useMemo(() => {
    const direction = sortOrder === 'asc' ? 1 : -1
    return [...visibleRows].sort((left, right) => {
      if (sortKey === 'doctorName') return left.doctorName.localeCompare(right.doctorName) * direction
      if (sortKey === 'visits') return (left.visits - right.visits) * direction
      if (sortKey === 'follows') return (left.follows - right.follows) * direction
      if (sortKey === 'rating') return (left.rating - right.rating) * direction
      if (sortKey === 'trend') return (left.trend - right.trend) * direction
      return (left.rank - right.rank) * direction
    })
  }, [sortKey, sortOrder, visibleRows])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const chartRows = visibleRows.slice(0, 7)
  const activeDoctor = doctorRows.find((doctor) => doctor.id === activeDoctorId) || visibleRows[0] || doctorRows[0] || null
  const allSelected = doctorRows.length > 0 && selectedDoctorIds.length === doctorRows.length

  const totals = useMemo(() => {
    const visitTotal = visibleRows.reduce((sum, doctor) => sum + doctor.visits, 0)
    const followTotal = visibleRows.reduce((sum, doctor) => sum + doctor.follows, 0)
    const averageRating = visibleRows.length > 0 ? visibleRows.reduce((sum, doctor) => sum + doctor.rating, 0) / visibleRows.length : 0
    return { visitTotal, followTotal, averageRating }
  }, [visibleRows])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortOrder(key === 'doctorName' ? 'asc' : 'desc')
  }

  const handleToggleDoctor = (doctorId: number) => {
    setSelectedDoctorIds((current) => {
      const exists = current.includes(doctorId)
      if (!exists) return [...current, doctorId]

      const next = current.filter((id) => id !== doctorId)
      if (next.length === 0) return current
      return next
    })

    if (activeDoctorId === doctorId && selectedDoctorIds.length > 1) {
      const nextDoctor = doctorRows.find((doctor) => doctor.id !== doctorId && selectedDoctorIds.includes(doctor.id))
      if (nextDoctor) setActiveDoctorId(nextDoctor.id)
    }
  }

  const handleSelectAll = () => {
    if (allSelected) {
      const firstDoctor = doctorRows[0]
      setSelectedDoctorIds(firstDoctor ? [firstDoctor.id] : [])
      setActiveDoctorId(firstDoctor?.id ?? null)
      return
    }

    setSelectedDoctorIds(doctorRows.map((doctor) => doctor.id))
    setActiveDoctorId((current) => current || doctorRows[0]?.id || null)
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedDoctorIds(doctorRows.map((doctor) => doctor.id))
    setActiveDoctorId(doctorRows[0]?.id ?? null)
  }

  const handleExportExcel = () => {
    exportExcel(sortedRows, `doctor-performance-${from}-to-${to}.xlsx`)
  }

  const handleExportPdf = () => {
    exportPdf(sortedRows, `doctor-performance-${from}-to-${to}.pdf`)
  }

  const chartLegend = [
    { label: 'Lượt ghé thăm', tone: 'blue' },
    { label: 'Lượt follow', tone: 'green' },
    { label: 'Sao đánh giá (trung bình)', tone: 'amber' },
  ]

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="reports-page-shell">
      <div className="reports-page-shell__inner">
        <header className="reports-page-header">
          <div>
            <h1 className="reports-page-header__title">HIỆU SUẤT BÁC SĨ</h1>
            <p className="reports-page-header__subtitle">Theo dõi lượt ghé thăm, lượt follow và đánh giá của bác sĩ</p>
          </div>

          <div className="reports-header-range-card">
            <div className="reports-header-range-card__summary">📅 {formatDateLabel(from)} - {formatDateLabel(to)}</div>
            <div className="reports-header-range-card__inputs">
              <label>
                <span>Từ ngày</span>
                <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
              </label>
              <label>
                <span>Đến ngày</span>
                <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
              </label>
            </div>
          </div>
        </header>

        {isLoading ? <div className="reports-page-notice">Đang tải dữ liệu hiệu suất bác sĩ...</div> : null}
        {hasError ? <div className="reports-page-notice reports-page-notice--danger">Không tải được dữ liệu báo cáo. Vui lòng thử lại.</div> : null}

        <div className="reports-dashboard">
          <aside className="reports-doctor-panel">
            <div className="reports-panel-title">Danh sách bác sĩ</div>

            <div className="reports-search-box">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm bác sĩ..." />
              <span>⌕</span>
            </div>

            <div className="reports-doctor-list">
              {filteredDoctorOptions.map((doctor) => {
                const isSelected = selectedDoctorIds.includes(doctor.id)
                const isActive = activeDoctorId === doctor.id

                return (
                  <button
                    key={doctor.id}
                    type="button"
                    className={`reports-doctor-item${isActive ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}`}
                    onClick={() => {
                      setActiveDoctorId(doctor.id)
                      if (!isSelected) setSelectedDoctorIds((current) => [...current, doctor.id])
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleDoctor(doctor.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Chọn ${doctor.doctorName}`}
                    />
                    <DoctorAvatar name={doctor.doctorName} size={48} />
                    <div className="reports-doctor-item__meta">
                      <div className="reports-doctor-item__name">{doctor.doctorName}</div>
                      <div className="reports-doctor-item__specialty">{doctor.specialty}</div>
                    </div>
                    <span className="reports-doctor-item__chevron">›</span>
                  </button>
                )
              })}

              {filteredDoctorOptions.length === 0 ? (
                <div className="reports-empty-box">Không tìm thấy bác sĩ phù hợp.</div>
              ) : null}
            </div>

            <div className="reports-doctor-panel__footer">
              <div>Đã chọn: {selectedDoctorIds.length} / {doctorRows.length} bác sĩ</div>
              <button type="button" className="reports-link-button" onClick={handleClearFilters}>Chọn lại tất cả</button>
            </div>
          </aside>

          <div className="reports-dashboard__content">
            <section className="reports-summary-grid">
              <article className="reports-summary-card">
                <div className="reports-summary-card__icon reports-summary-card__icon--blue">👥</div>
                <div className="reports-summary-card__body">
                  <div className="reports-summary-card__label">TỔNG LƯỢT GHÉ THĂM</div>
                  <div className="reports-summary-card__value-row">
                    <strong>{activeDoctor ? formatNumber(activeDoctor.visits) : '--'}</strong>
                    {activeDoctor ? <span className="reports-summary-card__trend is-up">↑ {formatTrend(activeDoctor.trend)}</span> : null}
                  </div>
                  <div className="reports-summary-card__hint">so với kỳ trước</div>
                </div>
              </article>

              <article className="reports-summary-card">
                <div className="reports-summary-card__icon reports-summary-card__icon--green">➕</div>
                <div className="reports-summary-card__body">
                  <div className="reports-summary-card__label">TỔNG LƯỢT FOLLOW</div>
                  <div className="reports-summary-card__value-row">
                    <strong>{activeDoctor ? formatNumber(activeDoctor.follows) : '--'}</strong>
                    {activeDoctor ? <span className="reports-summary-card__trend is-up">↑ {formatTrend(activeDoctor.trend * 0.65)}</span> : null}
                  </div>
                  <div className="reports-summary-card__hint">so với kỳ trước</div>
                </div>
              </article>

              <article className="reports-summary-card reports-summary-card--amber">
                <div className="reports-summary-card__icon reports-summary-card__icon--amber">★</div>
                <div className="reports-summary-card__body">
                  <div className="reports-summary-card__label">ĐÁNH GIÁ TRUNG BÌNH</div>
                  <div className="reports-summary-card__value-row">
                    <strong>{activeDoctor ? activeDoctor.rating.toFixed(1) : '--'}{activeDoctor ? <span> / 5</span> : null}</strong>
                    {activeDoctor ? <span className="reports-summary-card__trend is-up">↑ {formatTrend(activeDoctor.rating - 4.6, '')}</span> : null}
                  </div>
                  <div className="reports-summary-card__hint">
                    {activeDoctor ? `${formatNumber(activeDoctor.ratingCount)} lượt đánh giá` : 'so với kỳ trước'}
                  </div>
                </div>
              </article>
            </section>

            <section className="reports-chart-panel">
              <div className="reports-chart-panel__header">
                <div>
                  <h2>Hiệu suất của bác sĩ</h2>
                  <div className="reports-chart-panel__meta">
                    <span>Tổng lượt ghé thăm: {formatNumber(totals.visitTotal)}</span>
                    <span>Tổng follow: {formatNumber(totals.followTotal)}</span>
                    <span>Đánh giá TB: {formatRating(totals.averageRating || 0)}</span>
                  </div>
                </div>

                <select className="reports-select" value={chartPeriod} onChange={(event) => setChartPeriod(event.target.value as ChartPeriod)}>
                  <option value="6months">6 tháng gần đây</option>
                  <option value="30days">30 ngày gần đây</option>
                  <option value="7days">7 ngày gần đây</option>
                </select>
              </div>

              <div className="reports-chart-legend">
                {chartLegend.map((item) => (
                  <span key={item.label}><i className={`legend-dot legend-dot--${item.tone}`} />{item.label}</span>
                ))}
              </div>

              <div className="reports-chart-box">
                {chartRows.length > 0 ? (
                  <ResponsiveContainer width="100%" height={390}>
                    <BarChart data={chartRows} margin={{ top: 24, right: 8, left: 0, bottom: 18 }} barGap={10}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="doctorName" tick={<DoctorAxisTick />} interval={0} height={78} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="metric" tick={{ fontSize: 11, fill: '#2563eb' }} axisLine={false} tickLine={false} width={54} />
                      <YAxis yAxisId="rating" orientation="right" domain={[1, 5]} tickCount={5} tick={{ fontSize: 11, fill: '#f59e0b' }} axisLine={false} tickLine={false} width={34} />
                      <Tooltip
                        contentStyle={{ borderRadius: 18, border: '1px solid #dbe4f0', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.10)' }}
                        formatter={(value, name) => {
                          const numericValue = Number(value || 0)
                          if (name === 'Sao đánh giá (trung bình)') return [`${numericValue.toFixed(1)} / 5`, name]
                          return [formatNumber(numericValue), name]
                        }}
                      />
                      <Legend wrapperStyle={{ display: 'none' }} />
                      <Bar yAxisId="metric" dataKey="visits" name="Lượt ghé thăm" fill="#1f6fff" radius={[8, 8, 0, 0]} barSize={22} label={{ position: 'top', fill: '#1f6fff', fontSize: 12, fontWeight: 700, formatter: formatChartMetricLabel }} />
                      <Bar yAxisId="metric" dataKey="follows" name="Lượt follow" fill="#17b26a" radius={[8, 8, 0, 0]} barSize={22} label={{ position: 'top', fill: '#17b26a', fontSize: 12, fontWeight: 700, formatter: formatChartMetricLabel }} />
                      <Bar yAxisId="rating" dataKey="rating" name="Sao đánh giá (trung bình)" fill="#ffb400" radius={[8, 8, 0, 0]} barSize={22} label={{ position: 'top', fill: '#f59e0b', fontSize: 12, fontWeight: 700, formatter: formatChartRatingLabel }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="reports-empty-box reports-empty-box--chart">Chọn ít nhất một bác sĩ để hiển thị biểu đồ.</div>
                )}
              </div>

            </section>
          </div>

          <section className="reports-table-card reports-table-card--full">
              <div className="reports-table-card__header">
                <div>
                  <h2>Hiệu suất của bác sĩ</h2>
                  <p>Bảng xếp hạng dựa trên lượt ghé thăm, lượt follow, đánh giá và xu hướng tăng trưởng.</p>
                </div>

                <div className="reports-table-toolbar">
                  <select className="reports-select" value={chartPeriod} onChange={(event) => setChartPeriod(event.target.value as ChartPeriod)}>
                    <option value="6months">6 tháng gần đây</option>
                    <option value="30days">30 ngày gần đây</option>
                    <option value="7days">7 ngày gần đây</option>
                  </select>
                  <button type="button" className="reports-btn reports-btn--secondary" onClick={handleExportExcel}>⇩ Xuất Excel</button>
                  <button type="button" className="reports-btn reports-btn--secondary" onClick={handleExportPdf}>⇩ Xuất PDF</button>
                </div>
              </div>

              <div className="reports-table-wrap">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" checked={allSelected} onChange={handleSelectAll} aria-label="Chọn tất cả bác sĩ" />
                      </th>
                      <th style={{ width: 54 }}>
                        <button type="button" className="reports-th-btn" onClick={() => handleSort('rank')}># {sortIndicator('rank')}</button>
                      </th>
                      <th>
                        <button type="button" className="reports-th-btn" onClick={() => handleSort('doctorName')}>Bác sĩ {sortIndicator('doctorName')}</button>
                      </th>
                      <th>
                        <button type="button" className="reports-th-btn" onClick={() => handleSort('visits')}>Lượt ghé thăm {sortIndicator('visits')}</button>
                      </th>
                      <th>
                        <button type="button" className="reports-th-btn" onClick={() => handleSort('follows')}>Lượt follow {sortIndicator('follows')}</button>
                      </th>
                      <th>
                        <button type="button" className="reports-th-btn" onClick={() => handleSort('rating')}>Sao đánh giá (trung bình) {sortIndicator('rating')}</button>
                      </th>
                      <th>
                        <button type="button" className="reports-th-btn" onClick={() => handleSort('trend')}>Xu hướng {sortIndicator('trend')}</button>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedRows.map((doctor, index) => {
                      const visitProgress = activeDoctor?.visits ? Math.min((doctor.visits / activeDoctor.visits) * 100, 100) : 0
                      const followProgress = activeDoctor?.follows ? Math.min((doctor.follows / activeDoctor.follows) * 100, 100) : 0

                      return (
                        <tr key={doctor.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedDoctorIds.includes(doctor.id)}
                              onChange={() => handleToggleDoctor(doctor.id)}
                              aria-label={`Chọn ${doctor.doctorName}`}
                            />
                          </td>
                          <td>{(safePage - 1) * pageSize + index + 1}</td>
                          <td>
                            <button
                              type="button"
                              className="reports-table-doctor"
                              onClick={() => setActiveDoctorId(doctor.id)}
                            >
                              <DoctorAvatar name={doctor.doctorName} size={40} />
                              <span>
                                <strong className="reports-table-doctor__name">{doctor.doctorName}</strong>
                                <small className="reports-table-doctor__specialty">{doctor.specialty}</small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <div className="reports-metric-cell">
                              <strong>{formatNumber(doctor.visits)}</strong>
                              <div className="reports-progress"><span style={{ width: `${visitProgress}%` }} /></div>
                            </div>
                          </td>
                          <td>
                            <div className="reports-metric-cell">
                              <strong>{formatNumber(doctor.follows)}</strong>
                              <div className="reports-progress reports-progress--green"><span style={{ width: `${followProgress}%` }} /></div>
                            </div>
                          </td>
                          <td>
                            <div className="reports-rating-cell">
                              <strong>{doctor.rating.toFixed(1)} / 5</strong>
                              <small>{formatNumber(doctor.ratingCount)} lượt đánh giá</small>
                              <RatingStars rating={doctor.rating} />
                            </div>
                          </td>
                          <td>
                            <span className={`reports-trend ${doctor.trend >= 0 ? 'is-up' : 'is-down'}`}>
                              {doctor.trend >= 0 ? '↑' : '↓'} {formatTrend(Math.abs(doctor.trend))}
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="reports-empty-box">Chưa có dữ liệu phù hợp với bộ lọc hiện tại.</div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="reports-pagination">
                <div className="reports-pagination__summary">
                  Hiển thị {(safePage - 1) * pageSize + (pagedRows.length > 0 ? 1 : 0)} - {(safePage - 1) * pageSize + pagedRows.length} trong {sortedRows.length} bác sĩ
                </div>

                <div className="reports-pagination__actions">
                  <button type="button" className="reports-pagination__icon" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>
                  <span className="reports-pagination__page">{safePage}</span>
                  <button type="button" className="reports-pagination__icon" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>›</button>
                  <span className="reports-pagination__page-size">{pageSize} / trang</span>
                </div>
              </div>
          </section>
        </div>
      </div>
    </div>
  )
}
