import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { TimeSlot, WorkingSchedule, WorkingSlot } from '../../api/types'
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

export function DoctorSchedulePage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [date, setDate] = useState(todayYmd())
  const [gioBatDau, setGioBatDau] = useState('08:00')
  const [gioKetThuc, setGioKetThuc] = useState('11:00')
  const [maKhungGio, setMaKhungGio] = useState<number>(30)
  const [soLuongToiDa, setSoLuongToiDa] = useState<number>(1)
  const [trangThaiLich, setTrangThaiLich] = useState('SAP_DIEN_RA')
  const [error, setError] = useState<string | null>(null)

  const timeSlotsQuery = useQuery({
    queryKey: ['time-slots'],
    queryFn: async () => (await api.get<TimeSlot[]>('/api/time-slots')).data,
  })

  const slotsQuery = useQuery({
    queryKey: ['working-slots', maBacSi, date],
    queryFn: async () =>
      (await api.get<WorkingSlot[]>(`/api/doctors/${maBacSi}/working-slots`, { params: { date } })).data,
    enabled: !!maBacSi && !!date,
  })

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!maBacSi) throw new Error('Thiếu maBacSi')
      const res = await api.put<WorkingSchedule[]>(`/api/doctors/${maBacSi}/working-slots`, {
        items: [
          {
            thuTrongTuan: null,
            ngayCuThe: date,
            gioBatDau,
            gioKetThuc,
            maKhungGio,
            soLuongToiDa,
            trangThaiLich,
          },
        ],
      })
      return res.data
    },
    onSuccess: async () => {
      setError(null)
      alert('Cập nhật lịch thành công')
      await qc.invalidateQueries({ queryKey: ['working-slots', maBacSi, date] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const timeSlotOptions = useMemo(() => timeSlotsQuery.data || [], [timeSlotsQuery.data])

  return (
    <>
      <PageHeader title="Lịch làm việc" />

      {!maBacSi ? <div className="card">Thiếu maBacSi. Hãy đăng nhập lại.</div> : null}

      <div className="card stack">
        <div className="grid">
          <div className="stack">
            <div className="label">Ngày</div>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="stack">
            <div className="label">Giờ bắt đầu</div>
            <input className="input" type="time" value={gioBatDau} onChange={(e) => setGioBatDau(e.target.value)} />
          </div>
          <div className="stack">
            <div className="label">Giờ kết thúc</div>
            <input className="input" type="time" value={gioKetThuc} onChange={(e) => setGioKetThuc(e.target.value)} />
          </div>
          <div className="stack">
            <div className="label">Khung giờ</div>
            <select className="input" value={maKhungGio} onChange={(e) => setMaKhungGio(Number(e.target.value))}>
              {timeSlotOptions.map((t) => (
                <option key={t.maKhungGio} value={t.maKhungGio}>
                  #{t.maKhungGio} • {t.thoiLuongPhut} phút
                </option>
              ))}
            </select>
          </div>
          <div className="stack">
            <div className="label">Số lượng tối đa</div>
            <input
              className="input"
              type="number"
              min={1}
              value={soLuongToiDa}
              onChange={(e) => setSoLuongToiDa(Number(e.target.value))}
            />
          </div>
          <div className="stack">
            <div className="label">Trạng thái lịch</div>
            <select className="input" value={trangThaiLich} onChange={(e) => setTrangThaiLich(e.target.value)}>
              {['SAP_DIEN_RA', 'DANG_DIEN_RA', 'TAM_DUNG_NHAN_LICH', 'DA_HUY'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

        <button className="btn btn-primary" type="button" disabled={upsertMutation.isPending} onClick={() => upsertMutation.mutate()}>
          {upsertMutation.isPending ? 'Đang lưu…' : 'Lưu lịch'}
        </button>
      </div>

      <div style={{ height: 12 }} />

      <div className="card stack">
        <div className="title">Khung giờ ngày {date}</div>
        {slotsQuery.isLoading ? <div className="muted">Đang tải…</div> : null}
        {slotsQuery.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(slotsQuery.error)}
          </div>
        ) : null}

        {(slotsQuery.data || []).length === 0 ? <div className="muted">Chưa có slot.</div> : null}
        <div className="stack">
          {(slotsQuery.data || []).map((s) => (
            <div key={s.maChiTiet} className="row-between card">
              <div>
                <b>{s.gioBatDau.slice(0, 5)}–{s.gioKetThuc.slice(0, 5)}</b> • <span className="muted">{s.trangThai}</span>
              </div>
              <span className="chip">{s.trangThaiLich}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

