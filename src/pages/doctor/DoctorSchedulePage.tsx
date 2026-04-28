import { useMemo, useState } from 'react'
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

type NoticeState = {
  tone: 'success' | 'danger'
  title: string
  description: string
} | null

function todayYmd() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function diffMinutes(start: string, end: string) {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)

  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute

  return Math.max(endTotal - startTotal, 0)
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
  const [notice, setNotice] = useState<NoticeState>(null)

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
      if (!maBacSi) throw new Error('Thiếu mã bác sĩ')

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
      setNotice({
        tone: 'success',
        title: 'Đã cập nhật lịch làm việc',
        description: 'Khung giờ làm việc của bạn đã được lưu thành công.',
      })
      await qc.invalidateQueries({ queryKey: ['working-slots', maBacSi, date] })
    },
    onError: (err) =>
      setNotice({
        tone: 'danger',
        title: 'Không thể lưu lịch làm việc',
        description: getApiErrorMessage(err),
      }),
  })

  const timeSlotOptions = timeSlotsQuery.data ?? []
  const slots = slotsQuery.data ?? []

  const duration = useMemo(
    () => timeSlotOptions.find((slot) => slot.maKhungGio === maKhungGio)?.thoiLuongPhut ?? 0,
    [maKhungGio, timeSlotOptions],
  )

  const sessionMinutes = diffMinutes(gioBatDau, gioKetThuc)
  const estimatedSlots = duration > 0 ? Math.floor(sessionMinutes / duration) : 0
  const scheduleStatus = getScheduleStatusMeta(trangThaiLich)

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Working schedule"
        title="Lịch làm việc"
        description="Thiết lập ca khám theo ngày cụ thể với giao diện rõ nhịp, dễ đọc và phù hợp bối cảnh vận hành y khoa."
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
        <DoctorStatCard label="Ngày đang chỉnh" value={formatLongDate(date)} hint="Ngày cụ thể mà biểu mẫu hiện tại sẽ áp dụng." />
        <DoctorStatCard label="Thời lượng mỗi khung" value={duration > 0 ? `${duration} phút` : 'Chưa chọn'} hint="Lấy từ danh mục khung giờ của hệ thống." />
        <DoctorStatCard label="Số slot ước tính" value={String(estimatedSlots)} hint="Ước tính dựa trên giờ bắt đầu, kết thúc và độ dài khung giờ." />
        <DoctorStatCard label="Trạng thái lịch" value={scheduleStatus.label} hint="Thiết lập này ảnh hưởng trực tiếp đến khả năng nhận lịch từ bệnh nhân." />
      </section>

      <div className="doctor-schedule-grid">
        <DoctorPanel title="Biểu mẫu thiết lập ca làm việc" description="Điền nhanh ngày, khung giờ và trạng thái để mở hoặc điều chỉnh lịch khám.">
          <div className="doctor-form-grid doctor-form-grid--compact">
            <div className="doctor-field">
              <label className="doctor-label" htmlFor="schedule-date">
                Ngày cụ thể
              </label>
              <input id="schedule-date" className="doctor-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>

            <div className="doctor-field">
              <label className="doctor-label" htmlFor="schedule-start">
                Giờ bắt đầu
              </label>
              <input
                id="schedule-start"
                className="doctor-input"
                type="time"
                value={gioBatDau}
                onChange={(event) => setGioBatDau(event.target.value)}
              />
            </div>

            <div className="doctor-field">
              <label className="doctor-label" htmlFor="schedule-end">
                Giờ kết thúc
              </label>
              <input
                id="schedule-end"
                className="doctor-input"
                type="time"
                value={gioKetThuc}
                onChange={(event) => setGioKetThuc(event.target.value)}
              />
            </div>

            <div className="doctor-field">
              <label className="doctor-label" htmlFor="schedule-slot">
                Khung giờ
              </label>
              <select
                id="schedule-slot"
                className="doctor-select"
                value={maKhungGio}
                onChange={(event) => setMaKhungGio(Number(event.target.value))}
              >
                {timeSlotOptions.map((slot) => (
                  <option key={slot.maKhungGio} value={slot.maKhungGio}>
                    #{slot.maKhungGio} • {slot.thoiLuongPhut} phút
                  </option>
                ))}
              </select>
            </div>

            <div className="doctor-field">
              <label className="doctor-label" htmlFor="schedule-capacity">
                Số lượng tối đa
              </label>
              <input
                id="schedule-capacity"
                className="doctor-input"
                type="number"
                min={1}
                value={soLuongToiDa}
                onChange={(event) => setSoLuongToiDa(Number(event.target.value))}
              />
            </div>

            <div className="doctor-field">
              <label className="doctor-label" htmlFor="schedule-status">
                Trạng thái lịch
              </label>
              <select
                id="schedule-status"
                className="doctor-select"
                value={trangThaiLich}
                onChange={(event) => setTrangThaiLich(event.target.value)}
              >
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
              {upsertMutation.isPending ? 'Đang lưu lịch...' : 'Lưu lịch làm việc'}
            </button>
            <DoctorStatusBadge label={scheduleStatus.label} tone={scheduleStatus.tone} />
          </div>
        </DoctorPanel>

        <DoctorPanel title="Tóm tắt cấu hình hiện tại" description="Bản xem trước giúp bác sĩ kiểm tra nhanh logic ca làm việc trước khi lưu.">
          <div className="doctor-section-stack">
            <div className="doctor-note-card">
              <p className="doctor-note">Ngày áp dụng: {formatLongDate(date)}</p>
            </div>
            <div className="doctor-note-card">
              <p className="doctor-note">Khung giờ làm việc: {formatTimeRange(gioBatDau, gioKetThuc)}</p>
            </div>
            <div className="doctor-note-card">
              <p className="doctor-note">
                Ước tính có thể tạo khoảng {estimatedSlots} slot với thời lượng {duration || 0} phút mỗi lượt.
              </p>
            </div>
            <div className="doctor-note-card">
              <p className="doctor-note">
                Sức chứa tối đa hiện đặt là {soLuongToiDa} lịch hẹn và trạng thái đang là {scheduleStatus.label.toLowerCase()}.
              </p>
            </div>
          </div>
        </DoctorPanel>
      </div>

      <DoctorPanel
        title={`Khung giờ ngày ${formatLongDate(date)}`}
        description="Danh sách slot đã sinh ra hoặc đang tồn tại cho ngày đang chọn."
        aside={<span className="doctor-count-bubble">{slots.length}</span>}
      >
        {slotsQuery.isLoading ? (
          <DoctorNotice tone="info" title="Đang tải slot làm việc" description="Hệ thống đang đồng bộ danh sách khung giờ đã có trong ngày này." />
        ) : null}

        {slotsQuery.isError ? (
          <DoctorNotice tone="danger" title="Không thể tải slot làm việc" description={getApiErrorMessage(slotsQuery.error)} />
        ) : null}

        {!slotsQuery.isLoading && !slotsQuery.isError && slots.length === 0 ? (
          <DoctorEmptyState
            title="Ngày này chưa có slot làm việc"
            description="Bạn có thể lưu cấu hình phía trên để bắt đầu tạo lịch nhận bệnh cho ngày đã chọn."
          />
        ) : null}

        {slots.length > 0 ? (
          <div className="doctor-list">
            {slots.map((slot) => {
              const slotState = getSlotStateMeta(slot.trangThai)
              const scheduleState = getScheduleStatusMeta(slot.trangThaiLich)

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
                      <span className="doctor-meta-item__label">Khóa đến</span>
                      <div className="doctor-meta-item__value">{slot.khoaDen || 'Không khóa'}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Phiếu đặt hiện tại</span>
                      <div className="doctor-meta-item__value">
                        {slot.maPhieuDatLichHienTai ? `#${slot.maPhieuDatLichHienTai}` : 'Chưa có bệnh nhân'}
                      </div>
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
