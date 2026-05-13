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
type EditorMode = 'create' | 'edit' | 'add'
type CreateApplyMode = 'day' | 'week' | 'month'
type ExistingApplyMode = 'today' | 'forward'

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

function listDatesUntilMonthEnd(baseDate: Date) {
  const result: string[] = []
  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)

  for (let cursor = new Date(baseDate); cursor <= monthEnd; cursor = addDays(cursor, 1)) {
    if (ymd(cursor) >= todayYmd()) {
      result.push(ymd(cursor))
    }
  }

  return result
}

export function DoctorSchedulePage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [monthAnchor, setMonthAnchor] = useState(() => new Date())
  const [detailDate, setDetailDate] = useState(todayYmd())
  const [editorMode, setEditorMode] = useState<EditorMode>('create')
  const [createApplyMode, setCreateApplyMode] = useState<CreateApplyMode>('day')
  const [existingApplyMode, setExistingApplyMode] = useState<ExistingApplyMode>('today')
  const [gioBatDau, setGioBatDau] = useState('08:00')
  const [gioKetThuc, setGioKetThuc] = useState('11:00')
  const [maKhungGio, setMaKhungGio] = useState<number>(30)
  const [soLuongToiDa] = useState<number>(1)
  const [trangThaiLich, setTrangThaiLich] = useState('SAP_DIEN_RA')
  const [notice, setNotice] = useState<NoticeState>(null)
  const [knownDayStates, setKnownDayStates] = useState<Record<string, DayState>>({})

  const isPastDay = detailDate < todayYmd()

  const timeSlotsQuery = useQuery({
    queryKey: ['time-slots'],
    queryFn: async () => (await api.get<TimeSlot[]>('/api/time-slots')).data,
  })

  const slotsQuery = useQuery({
    queryKey: ['working-slots', maBacSi, detailDate],
    queryFn: async () =>
      (
        await api.get<WorkingSlot[]>(`/api/doctors/${maBacSi}/working-slots`, {
          params: { date: detailDate },
        })
      ).data,
    enabled: !!maBacSi && !!detailDate,
  })

  const timeSlotOptions = timeSlotsQuery.data ?? []
  const slots = slotsQuery.data ?? []
  const hasAnySlot = slots.length > 0

  useEffect(() => {
    if (isPastDay) return
    if (!hasAnySlot) {
      setEditorMode('create')
      return
    }
    setEditorMode((current) => (current === 'create' ? 'edit' : current))
  }, [detailDate, hasAnySlot, isPastDay])

  const getApplyDates = () => {
    if (isPastDay) return []
    const baseDate = new Date(detailDate)

    if (editorMode === 'create') {
      if (createApplyMode === 'day') return [detailDate]
      if (createApplyMode === 'week') {
        return Array.from({ length: 7 }, (_, index) => addDays(baseDate, index))
          .map((date) => ymd(date))
          .filter((date) => date >= todayYmd())
      }
      return listDatesUntilMonthEnd(baseDate)
    }

    if (existingApplyMode === 'today') return [detailDate]
    return listDatesUntilMonthEnd(baseDate)
  }

  const inferDayState = (targetSlots: WorkingSlot[], targetDate: string): DayState => {
    if (targetDate < todayYmd()) return 'gray'
    if (targetSlots.length === 0) return 'empty'
    if (targetSlots.some((slot) => slot.maPhieuDatLichHienTai)) return 'brown'
    return 'green'
  }

  useEffect(() => {
    if (slotsQuery.isLoading || slotsQuery.isError) return
    const nextState = inferDayState(slots, detailDate)
    setKnownDayStates((prev) => (prev[detailDate] === nextState ? prev : { ...prev, [detailDate]: nextState }))
  }, [detailDate, slots, slotsQuery.isError, slotsQuery.isLoading])

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!maBacSi) throw new Error('Thiếu mã bác sĩ')
      const targetDates = getApplyDates()
      if (targetDates.length === 0) throw new Error('Không có ngày hợp lệ để cập nhật.')

      const items = targetDates.map((date) => ({
        thuTrongTuan: null,
        ngayCuThe: date,
        gioBatDau,
        gioKetThuc,
        maKhungGio,
        soLuongToiDa,
        trangThaiLich,
      }))

      const res = await api.put<WorkingSchedule[]>(`/api/doctors/${maBacSi}/working-slots`, { items })
      return { data: res.data, targetDates }
    },
    onSuccess: async ({ targetDates }) => {
      const title = editorMode === 'create' ? 'Đã tạo lịch làm việc' : editorMode === 'edit' ? 'Đã chỉnh sửa lịch khám' : 'Đã thêm lịch làm việc'
      setNotice({
        tone: 'success',
        title,
        description: 'Các ngày áp dụng đã được cập nhật thành công.',
      })
      setKnownDayStates((prev) => {
        const next = { ...prev }
        for (const date of targetDates) {
          next[date] = trangThaiLich === 'DA_HUY' ? 'empty' : 'green'
        }
        return next
      })
      await qc.invalidateQueries({ queryKey: ['working-slots', maBacSi, detailDate] })
    },
    onError: (err) =>
      setNotice({
        tone: 'danger',
        title: 'Không thể lưu lịch làm việc',
        description: getApiErrorMessage(err),
      }),
  })

  const duration = useMemo(
    () => timeSlotOptions.find((slot) => slot.maKhungGio === maKhungGio)?.thoiLuongPhut ?? 0,
    [maKhungGio, timeSlotOptions],
  )
  const sessionMinutes = diffMinutes(gioBatDau, gioKetThuc)
  const estimatedSlots = duration > 0 ? Math.floor(sessionMinutes / duration) : 0
  const scheduleStatus = getScheduleStatusMeta(trangThaiLich)

  const dayStateByDate = useMemo(() => {
    const map = new Map<string, DayState>()
    const today = todayYmd()
    for (const day of monthGrid(monthAnchor)) {
      const key = ymd(day)
      map.set(key, key < today ? 'gray' : 'empty')
    }
    for (const [key, state] of Object.entries(knownDayStates)) {
      map.set(key, state)
    }
    for (const slot of slots) {
      const key = slot.ngayCuThe ?? detailDate
      if (slot.maPhieuDatLichHienTai) map.set(key, 'brown')
      else if (slot.trangThaiLich === 'SAP_DIEN_RA' || slot.trangThaiLich === 'DANG_DIEN_RA') map.set(key, 'green')
      else map.set(key, 'empty')
    }
    return map
  }, [detailDate, knownDayStates, monthAnchor, slots])

  const calendarDays = monthGrid(monthAnchor)
  const selectedDaySlots = slots
  const selectedDayState: DayState = isPastDay ? 'gray' : selectedDaySlots.length === 0 ? 'empty' : selectedDaySlots.some((slot) => slot.maPhieuDatLichHienTai) ? 'brown' : 'green'
  const selectedDayStateMeta =
    selectedDayState === 'gray'
      ? { label: 'Ngày đã qua', tone: 'neutral' as const }
      : selectedDayState === 'brown'
        ? { label: 'Đã có người đặt', tone: 'warning' as const }
        : selectedDayState === 'green'
          ? { label: 'Đã tạo lịch', tone: 'success' as const }
          : { label: 'Chưa có lịch', tone: 'info' as const }

  const applyModeLabel = editorMode === 'create' ? 'Áp dụng theo' : 'Áp dụng cho'
  const submitLabel = editorMode === 'create' ? 'Tạo lịch' : editorMode === 'edit' ? 'Lưu chỉnh sửa lịch khám' : 'Thêm lịch làm việc'

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Working schedule"
        title="Lịch làm việc"
        description="Bấm vào một ngày để tạo hoặc cập nhật lịch khám"
      />

      {!maBacSi ? (
        <DoctorNotice
          tone="danger"
          title="Thiếu liên kết mã bác sĩ"
          description="Phiên đăng nhập hiện không có mã bác sĩ. Hãy đăng nhập lại để tiếp tục cập nhật lịch."
        />
      ) : null}

      {notice ? <DoctorNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <section className="doctor-metrics-grid">
        <DoctorStatCard label="Ngày đang xem" value={formatLongDate(detailDate)} hint="Bấm vào từng ô ngày để xem chi tiết lịch của ngày đó." />
        <DoctorStatCard label="Trạng thái ngày chọn" value={selectedDayStateMeta.label} hint="Ngày đã có lịch sẽ mở chế độ Chỉnh sửa / Thêm lịch làm việc." />
        <DoctorStatCard label="Khung giờ" value={duration > 0 ? `${duration} phút` : 'Chưa chọn'} hint="Thời lượng lấy từ danh mục khung giờ của hệ thống." />
        <DoctorStatCard label="Trạng thái lịch" value={scheduleStatus.label} hint={scheduleStatus.description} />
      </section>

      <div className="doctor-schedule-layout">
        <div className="doctor-schedule-left">
          <DoctorPanel
            className="doctor-schedule-calendar-panel"
            title="Lịch tháng"
            description="Bấm 1 ngày bất kỳ để mở form tạo/chỉnh sửa ở vùng bên phải."
          >
            <div className="doctor-schedule-calendar-body">
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
                <button className="doctor-button doctor-button--secondary" type="button" onClick={() => setMonthAnchor(addDays(monthAnchor, -30))}>
                  Tháng trước
                </button>
                <div className="doctor-calendar-toolbar__title">{monthAnchor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</div>
                <button className="doctor-button doctor-button--secondary" type="button" onClick={() => setMonthAnchor(addDays(monthAnchor, 30))}>
                  Tháng sau
                </button>
              </div>

              <div className="doctor-calendar-grid">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                  <div key={day} className="doctor-calendar-weekday">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const key = ymd(day)
                  const state = dayStateByDate.get(key) ?? 'empty'
                  const isSelected = detailDate === key
                  const isToday = key === todayYmd()
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`doctor-calendar-day doctor-calendar-day--${state}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                      onClick={() => setDetailDate(key)}
                    >
                      <span className="doctor-calendar-day__date">{day.getDate()}</span>
                      <span className="doctor-calendar-day__meta">{state === 'brown' ? 'Đã đặt' : state === 'green' ? 'Đã tạo' : state === 'gray' ? 'Đã qua' : 'Trống'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </DoctorPanel>

          <DoctorPanel
            className="doctor-schedule-detail-panel"
            title={`Chi tiết lịch ngày ${formatLongDate(detailDate)}`}
            aside={<span className="doctor-count-bubble">{selectedDaySlots.length}</span>}
          >
            <div className="doctor-schedule-detail-body">
              {slotsQuery.isLoading ? <DoctorNotice tone="info" title="Đang tải slot làm việc" description="Hệ thống đang đồng bộ danh sách khung giờ của ngày đang chọn." /> : null}
              {slotsQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải slot làm việc" description={getApiErrorMessage(slotsQuery.error)} /> : null}

              {!slotsQuery.isLoading && !slotsQuery.isError && selectedDaySlots.length === 0 ? (
                <DoctorEmptyState title="Chưa có lịch cho ngày này" description="Chọn tạo lịch ở khung bên phải để thêm lịch khám." />
              ) : null}

              {selectedDaySlots.length > 0 ? (
                <div className="doctor-list">
                  {selectedDaySlots.map((slot) => {
                    const slotState = getSlotStateMeta(slot.trangThai)
                    const scheduleState = getScheduleStatusMeta(slot.trangThaiLich)
                    const locked = Boolean(slot.maPhieuDatLichHienTai)

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
                            <div className="doctor-meta-item__value">{isPastDay ? 'Chỉ xem' : locked ? 'Có người đặt' : 'Có thể chỉnh sửa'}</div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </DoctorPanel>
        </div>

        <DoctorPanel
          className="doctor-schedule-editor-panel"
          title="Tạo / cập nhật lịch làm việc"
          description="Form được gom gọn trong vùng thao tác, tự đổi trạng thái theo ngày bạn chọn."
          aside={<DoctorStatusBadge label={selectedDayStateMeta.label} tone={selectedDayStateMeta.tone} />}
        >
          <div className="doctor-schedule-editor-body">
            <div className="doctor-note-card">
              <p className="doctor-note">Ngày đang chọn: {formatLongDate(detailDate)}</p>
            </div>

            <div className="doctor-note-card">
              <p className="doctor-note">Khung giờ gợi ý: {formatTimeRange(gioBatDau, gioKetThuc)} • Ước tính {estimatedSlots} slot.</p>
            </div>

            <div className="doctor-editor-actions">
              {!hasAnySlot ? (
                <button className="doctor-button doctor-button--primary" type="button" onClick={() => setEditorMode('create')} disabled={isPastDay}>
                  Tạo lịch
                </button>
              ) : (
                <>
                  <button className={`doctor-button ${editorMode === 'edit' ? 'doctor-button--primary' : 'doctor-button--secondary'}`} type="button" onClick={() => setEditorMode('edit')} disabled={isPastDay}>
                    Chỉnh sửa lịch khám
                  </button>
                  <button className={`doctor-button ${editorMode === 'add' ? 'doctor-button--primary' : 'doctor-button--secondary'}`} type="button" onClick={() => setEditorMode('add')} disabled={isPastDay}>
                    Thêm lịch làm việc
                  </button>
                </>
              )}

              <button className="doctor-button doctor-button--secondary" type="button" onClick={() => setDetailDate(todayYmd())}>
                Chọn hôm nay
              </button>
            </div>

            {isPastDay ? (
              <DoctorNotice tone="warning" title="Ngày đã qua chỉ xem được" description="Hãy chọn ngày hiện tại hoặc các ngày sau để tạo/chỉnh sửa lịch." />
            ) : (
              <div className="doctor-section-stack">
                <div className="doctor-form-grid doctor-form-grid--compact">
                  <div className="doctor-field">
                    <label className="doctor-label" htmlFor="schedule-apply-mode">
                      {applyModeLabel}
                    </label>
                    {editorMode === 'create' ? (
                      <select id="schedule-apply-mode" className="doctor-select" value={createApplyMode} onChange={(event) => setCreateApplyMode(event.target.value as CreateApplyMode)}>
                        <option value="day">Theo ngày đã chọn</option>
                        <option value="week">Theo tuần (7 ngày tới)</option>
                        <option value="month">Theo tháng (đến hết tháng)</option>
                      </select>
                    ) : (
                      <select id="schedule-apply-mode" className="doctor-select" value={existingApplyMode} onChange={(event) => setExistingApplyMode(event.target.value as ExistingApplyMode)}>
                        <option value="today">Chỉ hôm nay</option>
                        <option value="forward">Hôm nay và các ngày phía sau</option>
                      </select>
                    )}
                  </div>

                  <div className="doctor-field">
                    <label className="doctor-label" htmlFor="schedule-start">
                      Giờ bắt đầu
                    </label>
                    <input id="schedule-start" className="doctor-input" type="time" value={gioBatDau} onChange={(event) => setGioBatDau(event.target.value)} />
                  </div>

                  <div className="doctor-field">
                    <label className="doctor-label" htmlFor="schedule-end">
                      Giờ kết thúc
                    </label>
                    <input id="schedule-end" className="doctor-input" type="time" value={gioKetThuc} onChange={(event) => setGioKetThuc(event.target.value)} />
                  </div>

                  <div className="doctor-field">
                    <label className="doctor-label" htmlFor="schedule-slot">
                      Loại khung giờ khám
                    </label>
                    <select id="schedule-slot" className="doctor-select" value={maKhungGio} onChange={(event) => setMaKhungGio(Number(event.target.value))}>
                      {timeSlotOptions.map((slot) => (
                        <option key={slot.maKhungGio} value={slot.maKhungGio}>
                          #{slot.maKhungGio} • {slot.thoiLuongPhut} phút
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="doctor-field">
                    <label className="doctor-label" htmlFor="schedule-status">
                      Trạng thái lịch
                    </label>
                    <select id="schedule-status" className="doctor-select" value={trangThaiLich} onChange={(event) => setTrangThaiLich(event.target.value)}>
                      {['SAP_DIEN_RA', 'DANG_DIEN_RA', 'TAM_DUNG_NHAN_LICH', 'DA_HUY'].map((status) => (
                        <option key={status} value={status}>
                          {getScheduleStatusMeta(status).label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="doctor-button-row">
                  <button className="doctor-button doctor-button--primary" type="button" disabled={upsertMutation.isPending || !maBacSi} onClick={() => upsertMutation.mutate()}>
                    {upsertMutation.isPending ? 'Đang lưu lịch...' : submitLabel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DoctorPanel>
      </div>
    </div>
  )
}
