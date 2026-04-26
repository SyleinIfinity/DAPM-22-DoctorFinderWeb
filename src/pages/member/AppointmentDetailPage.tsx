import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentDetail, Review } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

function normalizeTime(value: string): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

function appointmentEnded(a: AppointmentDetail): boolean {
  if (!a.ngayCuThe) return false
  const dt = new Date(`${a.ngayCuThe}T${a.gioKetThuc}`)
  if (!Number.isFinite(dt.getTime())) return false
  return Date.now() > dt.getTime()
}

export function AppointmentDetailPage() {
  const params = useParams()
  const qc = useQueryClient()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null

  const maPhieuDatLich = Number(params.maPhieuDatLich)

  const [error, setError] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [soSao, setSoSao] = useState(5)
  const [noiDung, setNoiDung] = useState('')

  const query = useQuery({
    queryKey: ['appointment-detail', maPhieuDatLich],
    queryFn: async () => (await api.get<AppointmentDetail>(`/api/appointments/${maPhieuDatLich}`)).data,
    enabled: Number.isFinite(maPhieuDatLich) && maPhieuDatLich > 0,
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<AppointmentDetail>(`/api/appointments/${maPhieuDatLich}/cancel`)
      return res.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointment-detail', maPhieuDatLich] })
      if (maNguoiDung) {
        await qc.invalidateQueries({ queryKey: ['appointments', maNguoiDung, 'upcoming'] })
        await qc.invalidateQueries({ queryKey: ['appointments', maNguoiDung, 'history'] })
      }
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const a = query.data
      if (!a) throw new Error('Thiếu dữ liệu phiếu')
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      const res = await api.post<Review>('/api/reviews', {
        maNguoiDung,
        maBacSi: a.maBacSi,
        soSao,
        noiDung: noiDung.trim() || null,
      })
      return res.data
    },
    onSuccess: async (created) => {
      alert('Đánh giá thành công')
      setShowReview(false)
      setNoiDung('')
      await qc.invalidateQueries({ queryKey: ['doctor-rating', created.maBacSi] })
      await qc.invalidateQueries({ queryKey: ['doctor-reviews', created.maBacSi] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const detail = query.data
  const canCancel = detail && (detail.trangThaiPhieu === 'CHO_XAC_NHAN' || detail.trangThaiPhieu === 'DA_XAC_NHAN')
  const canReview = useMemo(() => {
    if (!detail) return false
    if (detail.trangThaiPhieu !== 'DA_XAC_NHAN') return false
    return appointmentEnded(detail)
  }, [detail])

  if (!Number.isFinite(maPhieuDatLich) || maPhieuDatLich <= 0) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu" />
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Chi tiết phiếu" right={<Link to="/app/appointments">Danh sách</Link>} />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}

      {detail ? (
        <div className="card stack">
          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{detail.hoTenBacSi}</div>
              <div className="muted">
                {detail.ngayCuThe || '—'} • {normalizeTime(detail.gioBatDau)}–{normalizeTime(detail.gioKetThuc)}
              </div>
              <div className="muted">
                {detail.chuyenKhoa} • {detail.tenCoSoYTe}
              </div>
            </div>
            <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
              <span className="chip">{detail.trangThaiPhieu}</span>
              {detail.lyDoTuChoi ? <span className="chip">Lý do: {detail.lyDoTuChoi}</span> : null}
            </div>
          </div>

          {detail.trieuChungGhiChu ? (
            <div className="card">
              <div className="label">Triệu chứng / ghi chú</div>
              <div style={{ marginTop: 6 }}>{detail.trieuChungGhiChu}</div>
            </div>
          ) : null}

          <div className="row">
            <Link className="btn" to={`/app/doctors/${detail.maBacSi}`}>
              Hồ sơ bác sĩ
            </Link>
            {canCancel ? (
              <button className="btn btn-danger" type="button" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
                {cancelMutation.isPending ? 'Đang hủy…' : 'Hủy phiếu'}
              </button>
            ) : null}
            {canReview ? (
              <button className="btn btn-primary" type="button" onClick={() => setShowReview((v) => !v)}>
                Đánh giá
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
              {error}
            </div>
          ) : null}

          {showReview ? (
            <div className="card stack">
              <div className="title">Gửi đánh giá</div>
              <div className="grid">
                <div className="stack">
                  <div className="label">Số sao</div>
                  <select className="input" value={soSao} onChange={(e) => setSoSao(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="stack">
                  <div className="label">Bình luận (tùy chọn)</div>
                  <input className="input" value={noiDung} onChange={(e) => setNoiDung(e.target.value)} />
                </div>
                <div className="stack">
                  <div className="label">Hành động</div>
                  <button className="btn btn-primary" type="button" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>
                    {reviewMutation.isPending ? 'Đang gửi…' : 'Gửi đánh giá'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

