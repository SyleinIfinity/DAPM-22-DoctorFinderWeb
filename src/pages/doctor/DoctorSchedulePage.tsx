import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { TimeSlot, WorkingSchedule, WorkingSlot } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { getApiErrorMessage } from '../../utils/errors'
import {
  DoctorEmptyState,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  formatLongDate,
  formatTimeRange,
  getScheduleStatusMeta,
  getSlotStateMeta,
} from './doctorUi'

type NoticeState = { tone: 'success' | 'danger'; title: string; description: string } | null

type DayState = 'empty' | 'green' | 'brown' | 'gray'

function todayYmd() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function ymd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function diffMinutes(start: string, end: string) {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  return Math.max(endHour * 60 + endMinute - (startHour * 60 + startMinute), 0)
}

function monthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

export function DoctorSchedulePage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [selectedDates, setSelectedDates] = useState<string[]>([todayYmd()])
  const [monthAnchor, setMonthAnchor] = useState(() => new Date())
  const [detailDate, setDetailDate] = useState(todayYmd())
  const [showEditor, setShowEditor] = useState(false)
  const [gioBatDau, setGioBatDau] = useState('08:00')
  const [gioKetThuc, setGioKetThuc] = useState('11:00')
  const [maKhungGio, setMaKhungGio] = useState<number>(30)
  const [soLuongToiDa, setSoLuongToiDa] = useState<number>(1)
  const [trangThaiLich, setTrangThaiLich] = useState('SAP_DIEN_RA')
  const [notice, setNotice] = useState<NoticeState>(null)

  const timeSlotsQuery = useQuery({
    queryKey: ['time-slots'],
    queryFn: async () => (await api.get<TimeSlot[]>('/api/time-slots')).data,
  })

  const slotsQuery = useQuery({
    queryKey: ['working-slots', maBacSi, detailDate],
    queryFn: async () => (await api.get<WorkingSlot[]>(`/api/doctors/${maBacSi}/working-slots`, { params: { date: detailDate } })).data,
    enabled: !!maBacSi && !!detailDate,
  })

  useEffect(() => {
    setDetailDate(selectedDates[0] ?? todayYmd())
  }, [selectedDates])

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!maBacSi) throw new Error('Thiếu mã bác sĩ')
      const items = selectedDates.map((date) => ({
        thuTrongTuan: null,
        ngayCuThe: date,
        gioBatDau,
        gioKetThuc,
        maKhungGio,
        soLuongToiDa,
        trangThaiLich,
      }))
      const res = await api.put<WorkingSchedule[]>(`/api/doctors/${maBacSi}/working-slots`, { items })
      return res.data
    },
    onSuccess: async () => {
      setNotice({ tone: 'success', title: 'Đã lưu lịch làm việc', description: 'Các ngày đã chọn được cập nhật thành công.' })
      setShowEditor(false)
      await qc.invalidateQueries({ queryKey: ['working-slots', maBacSi, detailDate] })
    },
    onError: (err) => setNotice({ tone: 'danger', title: 'Không thể lưu lịch làm việc', description: getApiErrorMessage(err) }),
  })

  const timeSlotOptions = timeSlotsQuery.data ?? []
  const slots = slotsQuery.data ?? []

  const duration = useMemo(() => timeSlotOptions.find((slot) => slot.maKhungGio === maKhungGio)?.thoiLuongPhut ?? 0, [maKhungGio, timeSlotOptions])
  const sessionMinutes = diffMinutes(gioBatDau, gioKetThuc)
  const estimatedSlots = duration > 0 ? Math.floor(sessionMinutes / duration) : 0
  const scheduleStatus = getScheduleStatusMeta(trangThaiLich)

  const dayStateByDate = useMemo(() => {
    const map = new Map<string, DayState>()
    const today = todayYmd()
    for (const day of monthGrid(monthAnchor)) {
      const key = ymd(day)
      if (key < today) {
        map.set(key, 'gray')
      } else {
        map.set(key, 'empty')
      }
    }
    for (const slot of slots) {
      const key = slot.ngayCuThe ?? detailDate
      if (slot.maPhieuDatLichHienTai) map.set(key, 'brown')
      else if (slot.trangThaiLich === 'SAP_DIEN_RA' || slot.trangThaiLich === 'DANG_DIEN_RA') map.set(key, 'green')
      else map.set(key, 'empty')
    }
    return map
  }, [detailDate, monthAnchor, slots])

  const calendarDays = monthGrid(monthAnchor)
  const selectedDaySlots = slots
  const selectedDayState = dayStateByDate.get(detailDate) ?? 'empty'
  const selectedDayStateMeta =
    selectedDayState === 'gray'
      ? { label: 'Ngày đã qua', tone: 'neutral' as const }
      : selectedDayState === 'brown'
        ? { label: 'Đã có người đặt', tone: 'warning' as const }
        : selectedDayState === 'green'
          ? { label: 'Đã tạo lịch', tone: 'success' as const }
          : { label: 'Chưa có lịch', tone: 'info' as const }

  const toggleDate = (date: string, shiftKey: boolean) => {
    const today = todayYmd()
    setDetailDate(date)

    if (!shiftKey) {
      setSelectedDates([date])
      setShowEditor(date >= today)
      return
    }

    if (date < today) {
      setSelectedDates((prev) => (prev.includes(date) ? prev : [...prev, date]))
      return
    }
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((item) => item !== date) : [...prev, date],
    )
    setShowEditor(true)
  }

  const canEdit = selectedDayState !== 'brown' && selectedDayState !== 'gray'

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Working schedule"
        title="Lịch làm việc"
        description="Thiết kế lại theo dạng lịch tháng để bác sĩ chọn ngày, tạo khung giờ và xem chi tiết ngay bên dưới."
      />

      {!maBacSi ? (
        <DoctorNotice tone="danger" title="Thiếu liên kết mã bác sĩ" description="Phiên đăng nhập hiện không có mã bác sĩ. Hãy đăng nhập lại để tiếp tục cập nhật lịch." />
      ) : null}

      {notice ? <DoctorNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <section className="doctor-metrics-grid">
        <DoctorStatCard label="Ngày đang xem" value={formatLongDate(detailDate)} hint="Bấm vào từng ô ngày để xem chi tiết lịch của ngày đó." />
        <DoctorStatCard label="Số ngày đã chọn" value={String(selectedDates.length)} hint="Mặc định chọn 1 ngày, giữ Shift để chọn nhiều ngày." />
        <DoctorStatCard label="Khung giờ" value={duration > 0 ? `${duration} phút` : 'Chưa chọn'} hint="Thời lượng lấy từ danh mục khung giờ của hệ thống." />
        <DoctorStatCard label="Trạng thái" value={scheduleStatus.label} hint={scheduleStatus.description} />
      </section>

      <div className="doctor-schedule-grid">
        <DoctorPanel title="Lịch tháng" description="Mặc định chỉ chọn 1 ngày. Giữ Shift khi bấm để chọn nhiều ngày.">
          <div className="doctor-calendar-legend" aria-label="Bảng màu trạng thái lịch">
            <span className="doctor-calendar-legend__item">
              <span className="doctor-calendar-legend__dot doctor-calendar-legend__dot--empty" />
              Chưa có lịch
            </span>
            <span className="doctor-calendar-legend__item">
              <span className="doctor-calendar-legend__dot doctor-calendar-legend__dot--green" />
              Đã tạo lịch
            </span>
            <span className="doctor-calendar-legend__item">
              <span className="doctor-calendar-legend__dot doctor-calendar-legend__dot--brown" />
              Đã có người đặt
            </span>
            <span className="doctor-calendar-legend__item">
              <span className="doctor-calendar-legend__dot doctor-calendar-legend__dot--gray" />
              Ngày đã qua
            </span>
          </div>
          <div className="doctor-calendar-toolbar">
            <button className="doctor-button doctor-button--secondary" type="button" onClick={() => setMonthAnchor(addDays(monthAnchor, -30))}>Tháng trước</button>
            <div className="doctor-calendar-toolbar__title">{monthAnchor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</div>
            <button className="doctor-button doctor-button--secondary" type="button" onClick={() => setMonthAnchor(addDays(monthAnchor, 30))}>Tháng sau</button>
          </div>

          <div className="doctor-calendar-grid">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
              <div key={day} className="doctor-calendar-weekday">{day}</div>
            ))}
            {calendarDays.map((day) => {
              const key = ymd(day)
              const state = dayStateByDate.get(key) ?? 'empty'
              const isSelected = selectedDates.includes(key)
              const isToday = key === todayYmd()
              return (
                <button
                  key={key}
                  type="button"
                  className={`doctor-calendar-day doctor-calendar-day--${state}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                  onClick={(event) => toggleDate(key, event.shiftKey)}
                >
                  <span className="doctor-calendar-day__date">{day.getDate()}</span>
                  <span className="doctor-calendar-day__meta">
                    {state === 'brown' ? 'Đã đặt' : state === 'green' ? 'Đã tạo' : state === 'gray' ? 'Đã qua' : 'Trống'}
                  </span>
                </button>
              )
            })}
          </div>
        </DoctorPanel>

        <DoctorPanel
          title="Tạo / cập nhật lịch làm việc"
          description="Chọn 1 hoặc nhiều ngày trên lịch tháng rồi điền khung giờ để tạo hoặc cập nhật lịch."
          aside={<DoctorStatusBadge label={selectedDayStateMeta.label} tone={selectedDayStateMeta.tone} />}
        >
          <div className="doctor-note-card">
            <p className="doctor-note">Ngày đang chọn: {formatLongDate(detailDate)}</p>
          </div>
          <div className="doctor-note-card">
            <p className="doctor-note">
              {selectedDates.length > 0 ? `Đã chọn ${selectedDates.length} ngày.` : 'Chưa chọn ngày nào.'}
            </p>
          </div>
          <div className="doctor-button-row">
            <button className="doctor-button doctor-button--primary" type="button" disabled={!maBacSi} onClick={() => setShowEditor((value) => !value)}>
              {showEditor ? 'Đóng cửa sổ tạo lịch' : 'Tạo lịch làm việc'}
            </button>
            <button className="doctor-button doctor-button--secondary" type="button" onClick={() => setSelectedDates([todayYmd()])}>Chọn hôm nay</button>
          </div>

          {showEditor ? (
            <div className="doctor-section-stack" style={{ marginTop: 16 }}>
              <div className="doctor-form-grid doctor-form-grid--compact">
                <div className="doctor-field doctor-field--full">
                  <label className="doctor-label">Ngày đã chọn</label>
                  <div className="doctor-inline-text">{selectedDates.map((date) => formatLongDate(date)).join(' • ')}</div>
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="schedule-start">Giờ bắt đầu</label>
                  <input id="schedule-start" className="doctor-input" type="time" value={gioBatDau} onChange={(event) => setGioBatDau(event.target.value)} />
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="schedule-end">Giờ kết thúc</label>
                  <input id="schedule-end" className="doctor-input" type="time" value={gioKetThuc} onChange={(event) => setGioKetThuc(event.target.value)} />
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="schedule-slot">Loại khung giờ khám</label>
                  <select id="schedule-slot" className="doctor-select" value={maKhungGio} onChange={(event) => setMaKhungGio(Number(event.target.value))}>
                    {timeSlotOptions.map((slot) => (
                      <option key={slot.maKhungGio} value={slot.maKhungGio}>#{slot.maKhungGio} • {slot.thoiLuongPhut} phút</option>
                    ))}
                  </select>
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="schedule-capacity">Số lượng tối đa</label>
                  <input id="schedule-capacity" className="doctor-input" type="number" min={1} value={soLuongToiDa} onChange={(event) => setSoLuongToiDa(Number(event.target.value))} />
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="schedule-status">Trạng thái lịch</label>
                  <select id="schedule-status" className="doctor-select" value={trangThaiLich} onChange={(event) => setTrangThaiLich(event.target.value)}>
                    {['SAP_DIEN_RA', 'DANG_DIEN_RA', 'TAM_DUNG_NHAN_LICH', 'DA_HUY'].map((status) => (
                      <option key={status} value={status}>
                        {getScheduleStatusMeta(status).label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="doctor-note-card">
                <p className="doctor-note">Khung giờ gợi ý: {formatTimeRange(gioBatDau, gioKetThuc)} · Ước tính {estimatedSlots} slot · Cập nhật sáng lên khi bạn bấm hoàn tất.</p>
              </div>

              <div className="doctor-button-row">
                <button className="doctor-button doctor-button--primary" type="button" disabled={upsertMutation.isPending || !maBacSi || selectedDates.length === 0 || !canEdit} onClick={() => upsertMutation.mutate()}>
                  {upsertMutation.isPending ? 'Đang lưu lịch...' : 'Hoàn tất'}
                </button>
                {!canEdit ? <DoctorStatusBadge label="Không thể cập nhật" tone="danger" /> : null}
              </div>
            </div>
          ) : null}
        </DoctorPanel>
      </div>

      <DoctorPanel
        title={`Chi tiết lịch ngày ${formatLongDate(detailDate)}`}
        description="Bấm chọn ngày nào thì chi tiết của ngày đó sẽ hiển thị tại đây."
        aside={<span className="doctor-count-bubble">{selectedDaySlots.length}</span>}
      >
        {slotsQuery.isLoading ? <DoctorNotice tone="info" title="Đang tải slot làm việc" description="Hệ thống đang đồng bộ danh sách khung giờ của ngày đang chọn." /> : null}
        {slotsQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải slot làm việc" description={getApiErrorMessage(slotsQuery.error)} /> : null}

        {!slotsQuery.isLoading && !slotsQuery.isError && selectedDaySlots.length === 0 ? (
          <DoctorEmptyState title="Chưa có lịch cho ngày này" description="Chọn ngày trắng trên lịch để bắt đầu tạo khung giờ mới." />
        ) : null}

        {selectedDaySlots.length > 0 ? (
          <div className="doctor-list">
            {selectedDaySlots.map((slot) => {
              const slotState = getSlotStateMeta(slot.trangThai)
              const scheduleState = getScheduleStatusMeta(slot.trangThaiLich)
              const locked = Boolean(slot.maPhieuDatLichHienTai)
              const isPast = detailDate < todayYmd()

              return (
                <article key={slot.maChiTiet} className="doctor-list-card">
                  <div className="doctor-list-card__header">
                    <div>
                      <h3 className="doctor-list-card__title">{formatTimeRange(slot.gioBatDau, slot.gioKetThuc)}</h3>
                      <p className="doctor-list-card__subtitle">Khung {slot.thoiLuongPhut} phút • Mã chi tiết #{slot.maChiTiet}</p>
                    </div>
                    <div className="doctor-chip-row">
                      <DoctorStatusBadge label={slotState.label} tone={slotState.tone} />
                      <DoctorStatusBadge label={scheduleState.label} tone={scheduleState.tone} />
                    </div>
                  </div>

                  <div className="doctor-meta-list">
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Mã lịch làm việc</span>
                      <div className="doctor-meta-item__value">#{slot.maLichLamViec}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Mã khung giờ</span>
                      <div className="doctor-meta-item__value">#{slot.maKhungGio}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Phiếu đặt hiện tại</span>
                      <div className="doctor-meta-item__value">{slot.maPhieuDatLichHienTai ? `#${slot.maPhieuDatLichHienTai}` : 'Chưa có bệnh nhân'}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Trạng thái chỉnh sửa</span>
                      <div className="doctor-meta-item__value">{isPast ? 'Chỉ xem' : locked ? 'Không thể cập nhật' : 'Có thể cập nhật'}</div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </DoctorPanel>
    </div>
  )
}
