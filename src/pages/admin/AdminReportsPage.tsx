import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminDoctorProfileTrafficReport, AdminReportDoctorRank, AdminReportKeyword } from '../../api/types'
import { getApiErrorMessage } from '../../utils/errors'
import { DoctorNotice, DoctorPageHeading, DoctorPanel, DoctorStatCard } from '../doctor/doctorUi'

const PIE_COLORS = ['#0d9488', '#f59e0b', '#6366f1', '#ec4899', '#22c55e', '#94a3b8', '#8b5cf6', '#14b8a6']
type ExportKind = 'overview-csv' | 'top-view-csv' | 'top-follow-csv' | 'keywords-csv' | 'full-json'

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))]
  return lines.join('\n')
}

function triggerDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function PieChart({ slices }: { slices: { label: string; percent: number; color: string }[] }) {
  if (slices.length === 0) {
    return (
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e2e8f0, #f8fafc)',
          display: 'grid',
          placeItems: 'center',
          color: '#64748b',
          fontSize: 13,
          border: '1px solid rgba(148,163,184,0.25)',
        }}
      >
        Chưa có dữ liệu
      </div>
    )
  }

  let acc = 0
  const parts = slices.map((s) => {
    const start = acc
    acc += Math.max(0, s.percent)
    return `${s.color} ${start}% ${acc}%`
  })

  return (
    <div
      style={{
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: `conic-gradient(${parts.join(', ')})`,
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
        border: '1px solid rgba(255,255,255,0.8)',
      }}
    />
  )
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

export function AdminReportsPage() {
  const { from: defaultFrom, to: defaultTo } = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [previewKind, setPreviewKind] = useState<ExportKind | null>(null)

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

  const pieSlices = useMemo(() => {
    const data = trafficQuery.data
    if (!data?.slices?.length) return []
    return data.slices.map((s, i) => ({ label: s.label, percent: s.percent, color: PIE_COLORS[i % PIE_COLORS.length] }))
  }, [trafficQuery.data])

  const totalViews = trafficQuery.data?.totalViews ?? 0
  const trafficTopLabel = trafficQuery.data?.slices?.[0]?.label ?? 'Chưa có dữ liệu'
  const trafficTopPercent = trafficQuery.data?.slices?.[0]?.percent ?? 0

  const previewMeta = useMemo(() => {
    const fromDate = params.from.slice(0, 10)
    const toDate = params.to.slice(0, 10)

    if (previewKind === 'overview-csv') {
      return {
        title: 'Xem trước: Tổng quan báo cáo',
        fileName: `admin-overview-${fromDate}-to-${toDate}.csv`,
        headers: ['from', 'to', 'totalViews', 'topViewedDoctor', 'topViewedPercent'],
        rows: [[params.from, params.to, totalViews, trafficTopLabel, trafficTopPercent]],
      }
    }

    if (previewKind === 'top-view-csv') {
      return {
        title: 'Xem trước: Top bác sĩ được xem',
        fileName: `admin-top-view-${fromDate}-to-${toDate}.csv`,
        headers: ['rank', 'maBacSi', 'hoTenDayDu', 'count'],
        rows: (topViewQuery.data || []).map((r) => [r.rank, r.maBacSi, r.hoTenDayDu, r.count]),
      }
    }

    if (previewKind === 'top-follow-csv') {
      return {
        title: 'Xem trước: Top bác sĩ được follow',
        fileName: `admin-top-follow-${fromDate}-to-${toDate}.csv`,
        headers: ['rank', 'maBacSi', 'hoTenDayDu', 'count'],
        rows: (topFollowQuery.data || []).map((r) => [r.rank, r.maBacSi, r.hoTenDayDu, r.count]),
      }
    }

    if (previewKind === 'keywords-csv') {
      return {
        title: 'Xem trước: Từ khóa phổ biến',
        fileName: `admin-top-keywords-${fromDate}-to-${toDate}.csv`,
        headers: ['rank', 'keyword', 'count'],
        rows: (keywordsQuery.data || []).map((k) => [k.rank, k.keyword, k.count]),
      }
    }

    if (previewKind === 'full-json') {
      const payload = {
        from: params.from,
        to: params.to,
        totalViews,
        topViewedDoctor: trafficTopLabel,
        topViewedPercent: trafficTopPercent,
        topViewRanks: topViewQuery.data || [],
        topFollowRanks: topFollowQuery.data || [],
        keywords: keywordsQuery.data || [],
      }
      return {
        title: 'Xem trước: Full JSON',
        fileName: `admin-reports-${fromDate}-to-${toDate}.json`,
        json: JSON.stringify(payload, null, 2),
      }
    }

    return null
  }, [previewKind, params.from, params.to, totalViews, trafficTopLabel, trafficTopPercent, topViewQuery.data, topFollowQuery.data, keywordsQuery.data])

  const downloadPreview = () => {
    if (!previewMeta) return
    if ('json' in previewMeta && typeof previewMeta.json === 'string') {
      triggerDownload(previewMeta.json, previewMeta.fileName, 'application/json')
      return
    }
    const csv = toCsv(previewMeta.headers, previewMeta.rows)
    triggerDownload(csv, previewMeta.fileName, 'text/csv;charset=utf-8')
  }

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Admin reports"
        title="Báo cáo thống kê"
        description="Theo dõi tần suất xem hồ sơ, lượt follow và từ khóa tìm kiếm theo khoảng thời gian tùy chọn."
        actions={
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="doctor-button doctor-button--secondary"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
            >
              Xuất file
            </button>
            {isExportMenuOpen ? (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 44,
                  zIndex: 10,
                  minWidth: 220,
                  background: '#fff',
                  border: '1px solid rgba(15,23,42,0.12)',
                  borderRadius: 12,
                  boxShadow: '0 12px 30px rgba(15,23,42,0.16)',
                  padding: 8,
                  display: 'grid',
                  gap: 6,
                }}
              >
                {[
                  ['overview-csv', 'CSV: Tổng quan'],
                  ['top-view-csv', 'CSV: Top bác sĩ xem'],
                  ['top-follow-csv', 'CSV: Top bác sĩ follow'],
                  ['keywords-csv', 'CSV: Top từ khóa'],
                  ['full-json', 'JSON: Full báo cáo'],
                ].map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    className="doctor-button doctor-button--secondary"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => {
                      setPreviewKind(kind as ExportKind)
                      setIsExportMenuOpen(false)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        }
      />

      {previewMeta ? (
        <DoctorPanel
          title={previewMeta.title}
          description="Kiểm tra nhanh dữ liệu trước khi tải file."
          aside={
            <div className="doctor-button-row">
              <button
                type="button"
                className="doctor-button doctor-button--secondary"
                onClick={() => setPreviewKind(null)}
              >
                Đóng xem trước
              </button>
              <button
                type="button"
                className="doctor-button doctor-button--primary"
                onClick={downloadPreview}
              >
                Tải file này
              </button>
            </div>
          }
        >
          {'json' in previewMeta ? (
            <pre
              style={{
                margin: 0,
                maxHeight: 280,
                overflow: 'auto',
                fontSize: 12,
                background: '#0f172a',
                color: '#e2e8f0',
                padding: 12,
                borderRadius: 10,
              }}
            >
              {previewMeta.json}
            </pre>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {previewMeta.headers.map((header) => (
                      <th
                        key={header}
                        style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px 6px' }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewMeta.rows.length === 0 ? (
                    <tr>
                      <td colSpan={previewMeta.headers.length} style={{ padding: '10px 6px', color: '#64748b' }}>
                        Chưa có dữ liệu trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    previewMeta.rows.slice(0, 12).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}`} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 6px' }}>
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DoctorPanel>
      ) : null}

      <DoctorPanel
        title="Thống kê tổng quan"
        description="Các chỉ số chính của báo cáo được gom lại để theo dõi nhanh hơn."
      >
        <div className="doctor-metrics-grid">
          <DoctorStatCard label="Tổng lượt xem" value={String(totalViews)} hint="Số lần hồ sơ bác sĩ được mở trong khoảng thời gian đã chọn." />
          <DoctorStatCard label="Mục nổi bật" value={trafficTopLabel} hint={`${trafficTopPercent}% tổng lượt xem`} />
          <DoctorStatCard label="Bác sĩ được xem" value={String((topViewQuery.data || []).length)} hint="Số bác sĩ có mặt trong bảng xếp hạng xem." />
          <DoctorStatCard label="Từ khóa tìm kiếm" value={String((keywordsQuery.data || []).length)} hint="Các từ khóa được ghi nhận trong hệ thống." />
        </div>
      </DoctorPanel>

      <DoctorPanel title="Khoảng thời gian" description="Chọn mốc bắt đầu và kết thúc để lọc toàn bộ báo cáo phía dưới.">
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
        <DoctorNotice
          tone="info"
          title="Lưu ý dữ liệu"
          description="Dữ liệu thống kê được ghi khi người dùng gọi API xem bác sĩ hoặc tìm kiếm, có thể truyền viewerMaTaiKhoan nếu cần đối chiếu."
        />
      </DoctorPanel>

      <div className="doctor-request-grid" style={{ marginTop: 16 }}>
        <DoctorPanel title="Tần suất xem hồ sơ bác sĩ" description="Biểu đồ tròn thể hiện tỷ trọng lượt xem theo từng bác sĩ trong khoảng thời gian đã chọn.">
          <div className="doctor-button-row" style={{ gap: 24, alignItems: 'center' }}>
            <PieChart slices={pieSlices} />
            <div style={{ flex: 1, minWidth: 220 }}>
              {trafficQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải thống kê lượt xem" description={getApiErrorMessage(trafficQuery.error)} /> : null}
              {trafficQuery.isLoading ? <DoctorNotice tone="info" title="Đang tải lượt xem" description="Hệ thống đang đồng bộ dữ liệu thống kê." /> : null}
              <div className="doctor-section-stack">
                {(trafficQuery.data?.slices || []).map((s, i) => (
                  <div key={`${s.label}-${i}`} className="doctor-note-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="doctor-button-row" style={{ gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                    </span>
                    <span style={{ fontWeight: 700 }}>{s.value} ({s.percent}%)</span>
                  </div>
                ))}
                {(trafficQuery.data?.slices || []).length === 0 && !trafficQuery.isLoading ? (
                  <DoctorNotice tone="neutral" title="Chưa có dữ liệu" description="Chưa có lượt xem trong khoảng thời gian này." />
                ) : null}
              </div>
            </div>
          </div>
        </DoctorPanel>

        <DoctorPanel title="Bảng xếp hạng" description="Nhìn nhanh bác sĩ nào đang được xem và follow nhiều nhất.">
          <div className="doctor-section-stack">
            <div className="doctor-note-card">
              <p className="doctor-note" style={{ marginBottom: 10, fontWeight: 700 }}>Top bác sĩ được xem</p>
              {topViewQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải top xem" description={getApiErrorMessage(topViewQuery.error)} /> : null}
              {topViewQuery.isLoading ? <div className="muted">Đang tải…</div> : null}
              {(topViewQuery.data || []).map((r) => (
                <div key={r.maBacSi} className="doctor-inline-between" style={{ marginTop: 8, fontSize: 13 }}>
                  <span>#{r.rank} {r.hoTenDayDu}</span>
                  <span className="doctor-chip">{r.count}</span>
                </div>
              ))}
              {(topViewQuery.data || []).length === 0 && !topViewQuery.isLoading ? <div className="muted" style={{ fontSize: 13 }}>Chưa có dữ liệu.</div> : null}
            </div>

            <div className="doctor-note-card">
              <p className="doctor-note" style={{ marginBottom: 10, fontWeight: 700 }}>Top bác sĩ được follow</p>
              {topFollowQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải top follow" description={getApiErrorMessage(topFollowQuery.error)} /> : null}
              {topFollowQuery.isLoading ? <div className="muted">Đang tải…</div> : null}
              {(topFollowQuery.data || []).map((r) => (
                <div key={r.maBacSi} className="doctor-inline-between" style={{ marginTop: 8, fontSize: 13 }}>
                  <span>#{r.rank} {r.hoTenDayDu}</span>
                  <span className="doctor-chip">{r.count}</span>
                </div>
              ))}
              {(topFollowQuery.data || []).length === 0 && !topFollowQuery.isLoading ? <div className="muted" style={{ fontSize: 13 }}>Chưa có dữ liệu.</div> : null}
            </div>
          </div>
        </DoctorPanel>
      </div>

      <DoctorPanel title="Từ khóa tìm kiếm phổ biến" description="Các keyword được ghi nhận nhiều nhất trong phạm vi đã lọc.">
        {keywordsQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải từ khóa" description={getApiErrorMessage(keywordsQuery.error)} /> : null}
        {keywordsQuery.isLoading ? <DoctorNotice tone="info" title="Đang tải từ khóa" description="Hệ thống đang lấy danh sách từ khóa tìm kiếm." /> : null}
        <div className="doctor-list">
          {(keywordsQuery.data || []).map((k) => (
            <article key={`${k.keyword}-${k.rank}`} className="doctor-list-card">
              <div className="doctor-list-card__header">
                <div>
                  <h3 className="doctor-list-card__title">{k.keyword}</h3>
                  <p className="doctor-list-card__subtitle">Xếp hạng #{k.rank}</p>
                </div>
                <span className="doctor-chip">{k.count} lượt</span>
              </div>
            </article>
          ))}
          {(keywordsQuery.data || []).length === 0 && !keywordsQuery.isLoading ? (
            <DoctorNotice tone="neutral" title="Chưa có từ khóa" description="Hiện tại chưa ghi nhận từ khóa tìm kiếm nào trong khoảng thời gian này." />
          ) : null}
        </div>
      </DoctorPanel>
    </div>
  )
}
