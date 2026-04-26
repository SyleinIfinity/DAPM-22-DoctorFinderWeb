import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentRequest } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { getApiErrorMessage } from '../../utils/errors'
import {
  DoctorAvatar,
  DoctorEmptyState,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  formatShortDate,
  formatTimeRange,
  getAppointmentStatusMeta,
} from './doctorUi'

type NoticeState = {
  tone: 'success' | 'danger'
  title: string
  description: string
} | null

export function DoctorRequestsPage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [notice, setNotice] = useState<NoticeState>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [lyDoTuChoi, setLyDoTuChoi] = useState('')

  const query = useQuery({
    queryKey: ['appointment-requests', maBacSi],
    queryFn: async () => (await api.get<AppointmentRequest[]>(`/api/doctors/${maBacSi}/appointment-requests`)).data,
    enabled: !!maBacSi,
  })

  const requests = query.data ?? []

  const pendingCount = useMemo(
    () => requests.filter((request) => request.trangThaiPhieu === 'CHO_XAC_NHAN').length,
    [requests],
  )

  const symptomCount = useMemo(
    () => requests.filter((request) => Boolean(request.trieuChungGhiChu?.trim())).length,
    [requests],
  )

  const uniquePatients = useMemo(
    () => new Set(requests.map((request) => request.maNguoiDung)).size,
    [requests],
  )

  const approve = useMutation({
    mutationFn: async (maPhieuDatLich: number) => {
      await api.post(`/api/appointments/${maPhieuDatLich}/approve`)
    },
    onSuccess: async () => {
      setNotice({
        tone: 'success',
        title: 'Đã duyệt lịch hẹn',
        description: 'Yêu cầu đặt lịch đã được xác nhận thành công.',
      })
      await qc.invalidateQueries({ queryKey: ['appointment-requests', maBacSi] })
    },
    onError: (err) =>
      setNotice({
        tone: 'danger',
        title: 'Không thể duyệt lịch hẹn',
        description: getApiErrorMessage(err),
      }),
  })

  const reject = useMutation({
    mutationFn: async ({ maPhieuDatLich, reason }: { maPhieuDatLich: number; reason: string }) => {
      await api.post(`/api/appointments/${maPhieuDatLich}/reject`, { lyDoTuChoi: reason })
    },
    onSuccess: async () => {
      setNotice({
        tone: 'success',
        title: 'Đã từ chối lịch hẹn',
        description: 'Lý do từ chối đã được gửi kèm theo phiếu đặt lịch.',
      })
      setRejectingId(null)
      setLyDoTuChoi('')
      await qc.invalidateQueries({ queryKey: ['appointment-requests', maBacSi] })
    },
    onError: (err) =>
      setNotice({
        tone: 'danger',
        title: 'Không thể từ chối lịch hẹn',
        description: getApiErrorMessage(err),
      }),
  })

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Appointment queue"
        title="Yêu cầu đặt lịch"
        description="Xem, sàng lọc và phản hồi yêu cầu đặt khám trong một giao diện tập trung, rõ trạng thái và thuận tiện cho thao tác nhanh."
      />

      {!maBacSi ? (
        <DoctorNotice
          tone="danger"
          title="Thiếu liên kết mã bác sĩ"
          description="Phiên đăng nhập hiện không có mã bác sĩ. Hãy đăng nhập lại để tiếp tục duyệt lịch hẹn."
        />
      ) : null}

      {notice ? <DoctorNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <section className="doctor-metrics-grid">
        <DoctorStatCard label="Tổng yêu cầu" value={String(requests.length)} hint="Số lượng phiếu đặt lịch đang được nạp trong danh sách hiện tại." />
        <DoctorStatCard label="Chờ xác nhận" value={String(pendingCount)} hint="Những phiếu này nên được xử lý sớm để tránh chậm phản hồi cho bệnh nhân." />
        <DoctorStatCard label="Có ghi chú triệu chứng" value={String(symptomCount)} hint="Các yêu cầu có ghi chú giúp bác sĩ sàng lọc trước khi duyệt." />
        <DoctorStatCard label="Bệnh nhân riêng biệt" value={String(uniquePatients)} hint="Cho biết mức độ phân tán của các yêu cầu đang chờ." />
      </section>

      <DoctorPanel
        title="Danh sách yêu cầu"
        description="Mỗi phiếu hiển thị thời gian hẹn, thông tin bệnh nhân và ghi chú triệu chứng nếu có."
        aside={<span className="doctor-count-bubble">{requests.length}</span>}
      >
        {query.isLoading ? (
          <DoctorNotice
            tone="info"
            title="Đang tải yêu cầu đặt lịch"
            description="Hệ thống đang đồng bộ danh sách bệnh nhân chờ bác sĩ xác nhận."
          />
        ) : null}

        {query.isError ? (
          <DoctorNotice tone="danger" title="Không thể tải danh sách yêu cầu" description={getApiErrorMessage(query.error)} />
        ) : null}

        {!query.isLoading && !query.isError && requests.length === 0 ? (
          <DoctorEmptyState
            title="Không có yêu cầu chờ xác nhận"
            description="Khi có lịch hẹn mới, chúng sẽ xuất hiện tại đây để bạn duyệt hoặc từ chối ngay trên từng phiếu."
          />
        ) : null}

        {requests.length > 0 ? (
          <div className="doctor-list">
            {requests.map((request) => {
              const status = getAppointmentStatusMeta(request.trangThaiPhieu)
              const isRejecting = rejectingId === request.maPhieuDatLich

              return (
                <article key={request.maPhieuDatLich} className="doctor-list-card">
                  <div className="doctor-list-card__header">
                    <div className="doctor-profile-strip">
                      <DoctorAvatar name={request.hoTenBenhNhan} />
                      <div>
                        <h3 className="doctor-list-card__title">{request.hoTenBenhNhan}</h3>
                        <p className="doctor-list-card__subtitle">
                          {formatShortDate(request.ngayCuThe)} • {formatTimeRange(request.gioBatDau, request.gioKetThuc)}
                        </p>
                      </div>
                    </div>
                    <DoctorStatusBadge label={status.label} tone={status.tone} />
                  </div>

                  <div className="doctor-meta-list">
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Số điện thoại</span>
                      <div className="doctor-meta-item__value">{request.soDienThoaiBenhNhan}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Email</span>
                      <div className="doctor-meta-item__value">{request.emailBenhNhan}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Loại phiếu</span>
                      <div className="doctor-meta-item__value">{request.loaiPhieu}</div>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">Mã phiếu đặt lịch</span>
                      <div className="doctor-meta-item__value">#{request.maPhieuDatLich}</div>
                    </div>
                  </div>

                  {request.trieuChungGhiChu ? (
                    <div className="doctor-note-card">
                      <p className="doctor-note">Ghi chú triệu chứng: {request.trieuChungGhiChu}</p>
                    </div>
                  ) : null}

                  {isRejecting ? (
                    <div className="doctor-section-stack">
                      <div className="doctor-field">
                        <label className="doctor-label" htmlFor={`reject-reason-${request.maPhieuDatLich}`}>
                          Lý do từ chối
                        </label>
                        <textarea
                          id={`reject-reason-${request.maPhieuDatLich}`}
                          className="doctor-textarea"
                          value={lyDoTuChoi}
                          onChange={(event) => setLyDoTuChoi(event.target.value)}
                          placeholder="Nhập lý do từ chối rõ ràng để bệnh nhân dễ theo dõi."
                        />
                      </div>

                      <div className="doctor-button-row">
                        <button
                          className="doctor-button doctor-button--danger"
                          type="button"
                          disabled={reject.isPending || !lyDoTuChoi.trim()}
                          onClick={() =>
                            reject.mutate({
                              maPhieuDatLich: request.maPhieuDatLich,
                              reason: lyDoTuChoi.trim(),
                            })
                          }
                        >
                          {reject.isPending ? 'Đang gửi phản hồi...' : 'Xác nhận từ chối'}
                        </button>
                        <button
                          className="doctor-button doctor-button--secondary"
                          type="button"
                          onClick={() => {
                            setRejectingId(null)
                            setLyDoTuChoi('')
                          }}
                        >
                          Hủy thao tác
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="doctor-button-row">
                      <button
                        className="doctor-button doctor-button--primary"
                        type="button"
                        disabled={approve.isPending}
                        onClick={() => approve.mutate(request.maPhieuDatLich)}
                      >
                        {approve.isPending ? 'Đang duyệt...' : 'Đồng ý lịch hẹn'}
                      </button>
                      <button
                        className="doctor-button doctor-button--danger"
                        type="button"
                        disabled={reject.isPending}
                        onClick={() => {
                          setRejectingId(request.maPhieuDatLich)
                          setLyDoTuChoi('')
                        }}
                      >
                        Từ chối lịch hẹn
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : null}
      </DoctorPanel>
    </div>
  )
}
