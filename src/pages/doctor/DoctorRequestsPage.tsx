import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentDetail, AppointmentRequest } from '../../api/types'
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
  formatLongDate,
  formatShortDate,
  formatTimeRange,
  getAppointmentStatusMeta,
} from './doctorUi'

type NoticeState = {
  tone: 'success' | 'danger'
  title: string
  description: string
} | null

type RequestTab = 'all' | 'pending' | 'approved' | 'rejected'

function isRejectedStatus(status: string) {
  return status === 'TU_CHOI' || status === 'DA_TU_CHOI' || status === 'DA_HUY'
}

function isCompletedStatus(status: string) {
  return status === 'DA_KHAM' || status === 'HOAN_THANH'
}

function isApprovedStatus(status: string) {
  return status === 'DA_DUYET' || status === 'DA_XAC_NHAN' || isCompletedStatus(status)
}

function canMarkVisited(status: string) {
  return status === 'DA_DUYET' || status === 'DA_XAC_NHAN'
}

const TAB_LABELS: Record<RequestTab, string> = {
  all: 'Tất cả',
  pending: 'Chờ xác nhận',
  approved: 'Đã đồng ý',
  rejected: 'Đã từ chối',
}

function getDetailActionState(detail: AppointmentDetail | AppointmentRequest | null) {
  if (!detail) return null

  if (detail.trangThaiPhieu === 'CHO_XAC_NHAN') {
    return {
      title: 'Phiếu hẹn đang chờ bác sĩ phản hồi',
      description: 'Bạn có thể duyệt ngay nếu lịch phù hợp hoặc từ chối kèm lý do rõ ràng cho bệnh nhân.',
    }
  }

  if (canMarkVisited(detail.trangThaiPhieu)) {
    return {
      title: 'Lịch hẹn đã được xác nhận',
      description: 'Sau khi hoàn tất buổi khám, bấm nút xác nhận để cập nhật trạng thái phiếu hẹn.',
    }
  }

  if (isCompletedStatus(detail.trangThaiPhieu)) {
    return {
      title: 'Phiếu hẹn đã hoàn tất',
      description: 'Trạng thái này cho biết buổi khám đã diễn ra xong và không cần thao tác thêm.',
    }
  }

  return {
    title: 'Phiếu hẹn đã đóng',
    description: 'Phiếu này đã được xử lý và hiện chỉ còn chế độ xem thông tin chi tiết.',
  }
}

export function DoctorRequestsPage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [notice, setNotice] = useState<NoticeState>(null)
  const [activeTab, setActiveTab] = useState<RequestTab>('all')
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [lyDoTuChoi, setLyDoTuChoi] = useState('')

  const query = useQuery({
    queryKey: ['appointment-requests', maBacSi],
    queryFn: async () => (await api.get<AppointmentRequest[]>(`/api/doctors/${maBacSi}/appointment-requests`)).data,
    enabled: !!maBacSi,
  })

  const requests = query.data ?? []

  const filteredRequests = useMemo(() => {
    if (activeTab === 'pending') return requests.filter((request) => request.trangThaiPhieu === 'CHO_XAC_NHAN')
    if (activeTab === 'approved') return requests.filter((request) => isApprovedStatus(request.trangThaiPhieu))
    if (activeTab === 'rejected') return requests.filter((request) => isRejectedStatus(request.trangThaiPhieu))
    return requests
  }, [activeTab, requests])

  useEffect(() => {
    if (filteredRequests.length === 0) {
      setSelectedRequestId(null)
      setRejectingId(null)
      setLyDoTuChoi('')
      return
    }

    if (!selectedRequestId || !filteredRequests.some((request) => request.maPhieuDatLich === selectedRequestId)) {
      setSelectedRequestId(filteredRequests[0].maPhieuDatLich)
      setRejectingId(null)
      setLyDoTuChoi('')
    }
  }, [filteredRequests, selectedRequestId])

  const selectedRequest =
    filteredRequests.find((request) => request.maPhieuDatLich === selectedRequestId) ??
    requests.find((request) => request.maPhieuDatLich === selectedRequestId) ??
    null

  const detailQuery = useQuery({
    queryKey: ['appointment-detail', selectedRequestId],
    queryFn: async () => (await api.get<AppointmentDetail>(`/api/appointments/${selectedRequestId}`)).data,
    enabled: typeof selectedRequestId === 'number' && selectedRequestId > 0,
  })

  const pendingCount = useMemo(() => requests.filter((request) => request.trangThaiPhieu === 'CHO_XAC_NHAN').length, [requests])
  const approvedCount = useMemo(() => requests.filter((request) => isApprovedStatus(request.trangThaiPhieu)).length, [requests])
  const rejectedCount = useMemo(() => requests.filter((request) => isRejectedStatus(request.trangThaiPhieu)).length, [requests])

  const approve = useMutation({
    mutationFn: async (maPhieuDatLich: number) => {
      await api.post(`/api/appointments/${maPhieuDatLich}/approve`)
    },
    onSuccess: async (_, maPhieuDatLich) => {
      setNotice({ tone: 'success', title: 'Đã duyệt lịch hẹn', description: 'Yêu cầu đặt lịch đã được xác nhận thành công.' })
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['appointment-requests', maBacSi] }),
        qc.invalidateQueries({ queryKey: ['appointment-detail', maPhieuDatLich] }),
      ])
    },
    onError: (err) =>
      setNotice({ tone: 'danger', title: 'Không thể duyệt lịch hẹn', description: getApiErrorMessage(err) }),
  })

  const reject = useMutation({
    mutationFn: async ({ maPhieuDatLich, reason }: { maPhieuDatLich: number; reason: string }) => {
      await api.post(`/api/appointments/${maPhieuDatLich}/reject`, { lyDoTuChoi: reason })
    },
    onSuccess: async (_, { maPhieuDatLich }) => {
      setNotice({ tone: 'success', title: 'Đã từ chối lịch hẹn', description: 'Lý do từ chối đã được gửi kèm theo phiếu đặt lịch.' })
      setRejectingId(null)
      setLyDoTuChoi('')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['appointment-requests', maBacSi] }),
        qc.invalidateQueries({ queryKey: ['appointment-detail', maPhieuDatLich] }),
      ])
    },
    onError: (err) =>
      setNotice({ tone: 'danger', title: 'Không thể từ chối lịch hẹn', description: getApiErrorMessage(err) }),
  })

  const completeVisit = useMutation({
    mutationFn: async (maPhieuDatLich: number) => {
      await api.post(`/api/appointments/${maPhieuDatLich}/complete`)
    },
    onSuccess: async (__, maPhieuDatLich) => {
      setNotice({
        tone: 'success',
        title: 'Đã xác nhận hoàn tất buổi khám',
        description: 'Phiếu hẹn đã được cập nhật sang trạng thái đã khám.',
      })
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['appointment-requests', maBacSi] }),
        qc.invalidateQueries({ queryKey: ['appointment-detail', maPhieuDatLich] }),
      ])
    },
    onError: (err) =>
      setNotice({
        tone: 'danger',
        title: 'Không thể xác nhận đã khám',
        description: getApiErrorMessage(err),
      }),
  })

  const selectedDetail = detailQuery.data ?? null
  const currentStatus = selectedDetail?.trangThaiPhieu ?? selectedRequest?.trangThaiPhieu ?? ''
  const selectedStatus = getAppointmentStatusMeta(currentStatus)
  const actionState = getDetailActionState(selectedDetail ?? selectedRequest)
  const isRejecting = rejectingId === selectedRequestId

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Appointment queue"
        title="Lịch hẹn bệnh nhân"
        description="Danh sách bên trái dùng để chọn nhanh từng phiếu hẹn, còn phần bên phải tập trung toàn bộ chi tiết và thao tác xử lý."
      />

      {!maBacSi ? (
        <DoctorNotice
          tone="danger"
          title="Thiếu liên kết mã bác sĩ"
          description="Phiên đăng nhập hiện không có mã bác sĩ. Hãy đăng nhập lại để tiếp tục duyệt lịch hẹn."
        />
      ) : null}

      {notice ? <DoctorNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <section className="doctor-metrics-grid doctor-metrics-grid--compact">
        <DoctorStatCard label="Tổng yêu cầu" value={String(requests.length)} hint="Toàn bộ phiếu hẹn đang có trong danh sách hiện tại." />
        <DoctorStatCard label="Chờ xác nhận" value={String(pendingCount)} hint="Các phiếu cần phản hồi sớm để tránh chậm lịch." />
        <DoctorStatCard label="Đã đồng ý" value={String(approvedCount)} hint="Bao gồm các lịch đã xác nhận và đang theo dõi khám." />
        <DoctorStatCard label="Đã từ chối" value={String(rejectedCount)} hint="Các phiếu này đã đóng và có thể xem lại lý do xử lý." />
      </section>

      <div className="doctor-request-workspace">
        <DoctorPanel
          className="doctor-request-list-panel"
          title="Danh sách phiếu hẹn"
          description="Chọn một phiếu ở cột trái để xem thông tin chi tiết ở cột phải."
          aside={<span className="doctor-count-bubble">{filteredRequests.length}</span>}
        >
          <div className="doctor-request-list-body">
            <div className="doctor-tab-row">
              {(Object.keys(TAB_LABELS) as RequestTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? 'doctor-button doctor-button--primary' : 'doctor-button doctor-button--secondary'}
                  onClick={() => {
                    setActiveTab(tab)
                    setRejectingId(null)
                    setLyDoTuChoi('')
                  }}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {query.isLoading ? (
              <DoctorNotice tone="info" title="Đang tải yêu cầu đặt lịch" description="Hệ thống đang đồng bộ danh sách bệnh nhân chờ bác sĩ xác nhận." />
            ) : null}

            {query.isError ? (
              <DoctorNotice tone="danger" title="Không thể tải danh sách yêu cầu" description={getApiErrorMessage(query.error)} />
            ) : null}

            {!query.isLoading && !query.isError && filteredRequests.length === 0 ? (
              <DoctorEmptyState
                title="Không có phiếu hẹn ở tab này"
                description="Hãy chuyển sang nhóm khác để xem những phiếu đang chờ, đã duyệt hoặc đã từ chối."
              />
            ) : null}

            {filteredRequests.length > 0 ? (
              <div className="doctor-request-list">
                {filteredRequests.map((request) => {
                  const status = getAppointmentStatusMeta(request.trangThaiPhieu)
                  const isSelected = selectedRequestId === request.maPhieuDatLich

                  return (
                    <button
                      key={request.maPhieuDatLich}
                      type="button"
                      className={`doctor-request-item${isSelected ? ' is-selected' : ''}`}
                      onClick={() => {
                        setSelectedRequestId(request.maPhieuDatLich)
                        setRejectingId(null)
                        setLyDoTuChoi('')
                      }}
                    >
                      <div className="doctor-request-item__header">
                        <div className="doctor-profile-strip doctor-profile-strip--compact">
                          <DoctorAvatar name={request.hoTenBenhNhan} />
                          <div>
                            <h3 className="doctor-profile-strip__name">{request.hoTenBenhNhan}</h3>
                            <p className="doctor-profile-strip__meta">
                              {formatShortDate(request.ngayCuThe)} • {formatTimeRange(request.gioBatDau, request.gioKetThuc)}
                            </p>
                          </div>
                        </div>
                        <DoctorStatusBadge label={status.label} tone={status.tone} />
                      </div>

                      <div className="doctor-request-item__meta">
                        <span>Mã phiếu #{request.maPhieuDatLich}</span>
                        <span>{request.loaiPhieu}</span>
                      </div>

                      <p className="doctor-request-item__preview">
                        {request.trieuChungGhiChu?.trim() || 'Chưa có ghi chú triệu chứng từ bệnh nhân.'}
                      </p>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        </DoctorPanel>

        <DoctorPanel
          className="doctor-request-detail-panel"
          title={selectedRequest ? `Chi tiết phiếu hẹn #${selectedRequest.maPhieuDatLich}` : 'Chi tiết phiếu hẹn'}
          description={selectedRequest ? 'Thông tin đầy đủ của phiếu hẹn đang chọn và các thao tác xử lý tương ứng.' : 'Chọn một phiếu hẹn ở cột trái để xem nội dung.'}
          aside={selectedRequest ? <DoctorStatusBadge label={selectedStatus.label} tone={selectedStatus.tone} /> : null}
        >
          <div className="doctor-request-detail-body">
            {!selectedRequest ? (
              <DoctorEmptyState title="Chưa có phiếu nào được chọn" description="Khi bạn bấm vào một lịch hẹn ở bên trái, phần này sẽ hiển thị toàn bộ thông tin chi tiết." />
            ) : null}

            {selectedRequest && detailQuery.isLoading ? (
              <DoctorNotice tone="info" title="Đang tải chi tiết phiếu hẹn" description="Hệ thống đang lấy đầy đủ thông tin bệnh nhân, lịch khám và trạng thái xử lý." />
            ) : null}

            {selectedRequest && detailQuery.isError ? (
              <DoctorNotice tone="danger" title="Không thể tải chi tiết phiếu hẹn" description={getApiErrorMessage(detailQuery.error)} />
            ) : null}

            {selectedRequest ? (
              <div className="doctor-request-detail-stack">
                <div className="doctor-request-hero">
                  <div className="doctor-profile-strip">
                    <DoctorAvatar name={selectedDetail?.hoTenBenhNhan ?? selectedRequest.hoTenBenhNhan} />
                    <div>
                      <h3 className="doctor-profile-strip__name">{selectedDetail?.hoTenBenhNhan ?? selectedRequest.hoTenBenhNhan}</h3>
                      <p className="doctor-profile-strip__meta">
                        {formatLongDate(selectedDetail?.ngayCuThe ?? selectedRequest.ngayCuThe)} •{' '}
                        {formatTimeRange(selectedDetail?.gioBatDau ?? selectedRequest.gioBatDau, selectedDetail?.gioKetThuc ?? selectedRequest.gioKetThuc)}
                      </p>
                    </div>
                  </div>

                  <div className="doctor-request-hero__badges">
                    <DoctorStatusBadge label={selectedStatus.label} tone={selectedStatus.tone} />
                    <span className="doctor-chip">Mã chi tiết #{selectedDetail?.maChiTiet ?? selectedRequest.maChiTiet}</span>
                  </div>
                </div>

                <div className="doctor-meta-list">
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Số điện thoại</span>
                    <div className="doctor-meta-item__value">{selectedDetail?.soDienThoaiBenhNhan ?? selectedRequest.soDienThoaiBenhNhan}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Email</span>
                    <div className="doctor-meta-item__value">{selectedDetail?.emailBenhNhan ?? selectedRequest.emailBenhNhan}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Loại phiếu</span>
                    <div className="doctor-meta-item__value">{selectedDetail?.loaiPhieu ?? selectedRequest.loaiPhieu}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Mã phiếu đặt lịch</span>
                    <div className="doctor-meta-item__value">#{selectedDetail?.maPhieuDatLich ?? selectedRequest.maPhieuDatLich}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Cơ sở y tế</span>
                    <div className="doctor-meta-item__value">{selectedDetail?.tenCoSoYTe ?? 'Chưa cập nhật'}</div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Địa chỉ khám</span>
                    <div className="doctor-meta-item__value">{selectedDetail?.diaChiLamViec ?? 'Chưa cập nhật'}</div>
                  </div>
                </div>

                <div className="doctor-note-card">
                  <p className="doctor-note">
                    Ghi chú triệu chứng: {(selectedDetail?.trieuChungGhiChu ?? selectedRequest.trieuChungGhiChu)?.trim() || 'Chưa có ghi chú triệu chứng từ bệnh nhân.'}
                  </p>
                </div>

                {selectedDetail?.lyDoTuChoi ? (
                  <div className="doctor-note-card doctor-note-card--danger">
                    <p className="doctor-note">Lý do từ chối: {selectedDetail.lyDoTuChoi}</p>
                  </div>
                ) : null}

                {actionState ? (
                  <div className="doctor-request-action-box">
                    <div>
                      <h3 className="doctor-request-action-box__title">{actionState.title}</h3>
                      <p className="doctor-request-action-box__description">{actionState.description}</p>
                    </div>

                    {isRejecting ? (
                      <div className="doctor-section-stack">
                        <div className="doctor-field">
                          <label className="doctor-label" htmlFor={`reject-reason-${selectedRequest.maPhieuDatLich}`}>
                            Lý do từ chối
                          </label>
                          <textarea
                            id={`reject-reason-${selectedRequest.maPhieuDatLich}`}
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
                                maPhieuDatLich: selectedRequest.maPhieuDatLich,
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
                        {currentStatus === 'CHO_XAC_NHAN' ? (
                          <>
                            <button
                              className="doctor-button doctor-button--primary"
                              type="button"
                              disabled={approve.isPending}
                              onClick={() => approve.mutate(selectedRequest.maPhieuDatLich)}
                            >
                              {approve.isPending ? 'Đang duyệt...' : 'Đồng ý lịch hẹn'}
                            </button>
                            <button
                              className="doctor-button doctor-button--danger"
                              type="button"
                              disabled={reject.isPending}
                              onClick={() => {
                                setRejectingId(selectedRequest.maPhieuDatLich)
                                setLyDoTuChoi('')
                              }}
                            >
                              Từ chối lịch hẹn
                            </button>
                          </>
                        ) : null}

                        {canMarkVisited(currentStatus) ? (
                          <button
                            className="doctor-button doctor-button--primary"
                            type="button"
                            disabled={completeVisit.isPending}
                            onClick={() => completeVisit.mutate(selectedRequest.maPhieuDatLich)}
                          >
                            {completeVisit.isPending ? 'Đang cập nhật...' : 'Xác nhận đã khám'}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </DoctorPanel>
      </div>
    </div>
  )
}
