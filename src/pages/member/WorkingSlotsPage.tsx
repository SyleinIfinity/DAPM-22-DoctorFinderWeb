import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentDetail, DoctorProfile, WorkingSlot } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeTime(value: string): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

function slotAvailable(slot: WorkingSlot): boolean {
  const allowedSchedule = slot.trangThaiLich === 'SAP_DIEN_RA' || slot.trangThaiLich === 'DANG_DIEN_RA'
  if (!allowedSchedule) return false
  if (slot.trangThai === 'TRONG') return true
  if (slot.trangThai === 'DANG_GIU' && slot.khoaDen) {
    const until = new Date(slot.khoaDen).getTime()
    if (Number.isFinite(until) && until <= Date.now()) return true
  }
  return false
}

export function WorkingSlotsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()

  const maBacSi = Number(params.maBacSi)
  const maNguoiDung = session?.maNguoiDung ?? null

  const [date, setDate] = useState<string>(todayYmd())
  const [selected, setSelected] = useState<WorkingSlot | null>(null)
  const [loaiPhieu, setLoaiPhieu] = useState('KHAM')
  const [trieuChung, setTrieuChung] = useState('')
  const [error, setError] = useState<string | null>(null)

  const doctorQuery = useQuery({
    queryKey: ['doctor', maBacSi],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/${maBacSi}`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  })

  const slotsQuery = useQuery({
    queryKey: ['working-slots', maBacSi, date],
    queryFn: async () =>
      (await api.get<WorkingSlot[]>(`/api/doctors/${maBacSi}/working-slots`, { params: { date } })).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0 && !!date,
  })

  const sortedSlots = useMemo(() => {
    const slots = slotsQuery.data || []
    return [...slots].sort((a, b) => (a.gioBatDau || '').localeCompare(b.gioBatDau || ''))
  }, [slotsQuery.data])

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      if (!selected) throw new Error('Vui lòng chọn khung giờ')
      const res = await api.post<AppointmentDetail>('/api/appointments', {
        maNguoiDung,
        maChiTiet: selected.maChiTiet,
        loaiPhieu: loaiPhieu.trim() || 'KHAM',
        trieuChungGhiChu: trieuChung.trim() || null,
      })
      return res.data
    },
    onSuccess: (data) => {
      navigate(`/app/appointments/${data.maPhieuDatLich}`)
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <>
        <PageHeader title="Lịch làm việc" />
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Chọn lịch" right={<Link to={`/app/doctors/${maBacSi}`}>Hồ sơ bác sĩ</Link>} />

      <div className="card stack">
        <div className="row-between">
          <div className="stack" style={{ gap: 4 }}>
            <div style={{ fontWeight: 900 }}>{doctorQuery.data?.hoTenDayDu || 'Bác sĩ'}</div>
            <div className="muted">{doctorQuery.data?.chuyenKhoa || ''}</div>
          </div>
          <input className="input" style={{ width: 180 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {slotsQuery.isLoading ? <div className="muted">Đang tải khung giờ…</div> : null}
        {slotsQuery.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(slotsQuery.error)}
          </div>
        ) : null}

        {sortedSlots.length === 0 ? <div className="muted">Không có khung giờ khả dụng.</div> : null}

        <div className="stack">
          {sortedSlots.map((s) => {
            const ok = slotAvailable(s)
            const active = selected?.maChiTiet === s.maChiTiet
            return (
              <button
                key={s.maChiTiet}
                className={active ? 'btn btn-primary' : 'btn'}
                type="button"
                disabled={!ok}
                onClick={() => setSelected(s)}
                style={{ justifyContent: 'space-between', display: 'flex' }}
              >
                <span>
                  {normalizeTime(s.gioBatDau)}–{normalizeTime(s.gioKetThuc)}
                </span>
                <span className="muted">
                  {ok ? 'TRỐNG' : s.trangThai}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="card stack">
        <div className="title">Tạo phiếu đặt lịch</div>
        {!maNguoiDung ? (
          <div className="muted">Thiếu maNguoiDung trong session. Hãy đăng nhập lại.</div>
        ) : null}

        <div className="grid">
          <div className="stack">
            <div className="label">Loại phiếu</div>
            <input className="input" value={loaiPhieu} onChange={(e) => setLoaiPhieu(e.target.value)} />
          </div>
          <div className="stack">
            <div className="label">Mô tả triệu chứng (tùy chọn)</div>
            <input className="input" value={trieuChung} onChange={(e) => setTrieuChung(e.target.value)} />
          </div>
          <div className="stack">
            <div className="label">Hành động</div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!maNguoiDung || !selected || createAppointmentMutation.isPending}
              onClick={() => {
                setError(null)
                createAppointmentMutation.mutate()
              }}
            >
              {createAppointmentMutation.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>

        {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}
      </div>
    </>
  )
}

