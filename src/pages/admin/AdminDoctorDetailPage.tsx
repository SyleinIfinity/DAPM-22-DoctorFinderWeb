import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminDoctorAction, AdminDoctorDetail } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'
import { DoctorNotice, DoctorPanel, DoctorStatCard, DoctorStatusBadge } from '../doctor/doctorUi'

export function AdminDoctorDetailPage() {
  const params = useParams()
  const qc = useQueryClient()
  const maBacSi = Number(params.maBacSi)

  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin-doctor-detail', maBacSi],
    queryFn: async () => (await api.get<AdminDoctorDetail>(`/api/admin/doctors/${maBacSi}`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  })

  const approve = useMutation({
    mutationFn: async () => (await api.post<AdminDoctorAction>(`/api/admin/doctors/${maBacSi}/approve`)).data,
    onSuccess: async (data) => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-doctor-detail', maBacSi] })
      await qc.invalidateQueries({ queryKey: ['admin-pending-doctors'] })
      alert(data.message || 'Thành công')
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const reject = useMutation({
    mutationFn: async (lyDoTuChoi: string) => (await api.post<AdminDoctorAction>(`/api/admin/doctors/${maBacSi}/reject`, { lyDoTuChoi })).data,
    onSuccess: async (data) => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-doctor-detail', maBacSi] })
      await qc.invalidateQueries({ queryKey: ['admin-pending-doctors'] })
      alert(data.message || 'Thành công')
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <>
        <PageHeader title="Chi tiết hồ sơ" right={<Link to="/admin/pending-doctors">Danh sách</Link>} />
        <DoctorPanel>
          <DoctorNotice tone="danger" title="URL không hợp lệ" description="Mã bác sĩ trên đường dẫn không hợp lệ." />
        </DoctorPanel>
      </>
    )
  }

  return (
    <div className="doctor-page">
      <PageHeader title="Chi tiết hồ sơ" right={<Link to="/admin/pending-doctors">Danh sách</Link>} />

      <DoctorPanel title="Tổng quan hồ sơ" description="Thông tin bác sĩ và các hành động duyệt hồ sơ được trình bày rõ ràng hơn.">
        {query.isLoading ? <DoctorNotice tone="info" title="Đang tải…" description="Hệ thống đang lấy dữ liệu hồ sơ bác sĩ." /> : null}
        {query.isError ? <DoctorNotice tone="danger" title="Không thể tải hồ sơ" description={getApiErrorMessage(query.error)} /> : null}
        {error ? <DoctorNotice tone="danger" title="Thao tác thất bại" description={error} /> : null}

        {query.data ? (
          <>
            <div className="doctor-metrics-grid">
              <DoctorStatCard label="Tên bác sĩ" value={query.data.hoTenDayDu} hint={query.data.chuyenKhoa} />
              <DoctorStatCard label="Trạng thái" value={query.data.trangThaiHoSo} hint="Trạng thái duyệt hồ sơ hiện tại." />
              <DoctorStatCard label="Tài liệu" value={String(query.data.documents.length)} hint="Số minh chứng đang đính kèm." />
              <DoctorStatCard label="Cơ sở" value={query.data.tenCoSoYTe} hint={query.data.diaChiLamViec || 'Chưa cập nhật địa chỉ'} />
            </div>

            <div className="doctor-hero" style={{ marginTop: 16 }}>
              <div className="doctor-hero__content">
                <div className="doctor-hero__eyebrow">Hồ sơ bác sĩ</div>
                <h2 className="doctor-hero__title">{query.data.hoTenDayDu}</h2>
                <p className="doctor-hero__subtitle">
                  {query.data.chuyenKhoa} · {query.data.trinhDoChuyenMon}
                  <br />
                  {query.data.tenCoSoYTe}
                </p>
              </div>

              <div className="doctor-hero__aside">
                <DoctorStatusBadge label={query.data.trangThaiHoSo} tone={query.data.trangThaiHoSo === 'DA_DUYET' ? 'success' : query.data.trangThaiHoSo === 'CHO_DUYET' ? 'warning' : 'danger'} />
                <div className="doctor-keyfacts">
                  <div className="doctor-keyfact">
                    <span className="doctor-keyfact__label">Mã bác sĩ</span>
                    <span className="doctor-keyfact__value">#{query.data.maBacSi}</span>
                  </div>
                  <div className="doctor-keyfact">
                    <span className="doctor-keyfact__label">Mã tài khoản</span>
                    <span className="doctor-keyfact__value">#{query.data.maTaiKhoan}</span>
                  </div>
                  <div className="doctor-keyfact">
                    <span className="doctor-keyfact__label">Mã người dùng</span>
                    <span className="doctor-keyfact__value">#{query.data.maNguoiDung}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="doctor-request-grid" style={{ marginTop: 16 }}>
              <DoctorPanel title="Thông tin định danh" description="Các trường chính để đối chiếu hồ sơ và tài khoản liên kết.">
                <div className="doctor-meta-list">
                  <div className="doctor-meta-item"><span className="doctor-meta-item__label">Số điện thoại</span><div className="doctor-meta-item__value">{query.data.soDienThoai}</div></div>
                  <div className="doctor-meta-item"><span className="doctor-meta-item__label">Email</span><div className="doctor-meta-item__value">{query.data.email}</div></div>
                  <div className="doctor-meta-item"><span className="doctor-meta-item__label">Trình độ</span><div className="doctor-meta-item__value">{query.data.trinhDoChuyenMon}</div></div>
                  <div className="doctor-meta-item"><span className="doctor-meta-item__label">Chứng chỉ</span><div className="doctor-meta-item__value">{query.data.maChungChiHanhNghe}</div></div>
                </div>
              </DoctorPanel>

              <DoctorPanel title="Hành động duyệt" description="Phê duyệt hoặc từ chối hồ sơ ngay tại đây.">
                <div className="doctor-button-row">
                  <button className="doctor-button doctor-button--primary" type="button" disabled={approve.isPending} onClick={() => approve.mutate()}>
                    Phê duyệt
                  </button>
                  <button
                    className="doctor-button doctor-button--danger"
                    type="button"
                    disabled={reject.isPending}
                    onClick={() => {
                      const reason = prompt('Lý do từ chối:', 'Thiếu minh chứng')
                      if (!reason) return
                      reject.mutate(reason)
                    }}
                  >
                    Từ chối
                  </button>
                </div>
              </DoctorPanel>
            </div>

            <DoctorPanel title="Minh chứng" description="Các tài liệu đính kèm trong hồ sơ bác sĩ.">
              {query.data.documents.length === 0 ? (
                <DoctorNotice tone="info" title="Không có tài liệu" description="Hồ sơ này hiện chưa đính kèm minh chứng." />
              ) : (
                <div className="doctor-list">
                  {query.data.documents.map((doc) => (
                    <article key={doc.maTaiLieu} className="doctor-list-card">
                      <div className="doctor-list-card__header">
                        <div>
                          <h3 className="doctor-list-card__title">{doc.tieuDeTaiLieu}</h3>
                          <p className="doctor-list-card__subtitle">Mã tài liệu #{doc.maTaiLieu}</p>
                        </div>
                        <span className="doctor-chip">Tài liệu</span>
                      </div>
                      <a className="doctor-button doctor-button--secondary doctor-button-link" href={doc.duongDanFileUrl} target="_blank" rel="noreferrer">
                        Mở file
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </DoctorPanel>
          </>
        ) : null}
      </DoctorPanel>
    </div>
  )
}
