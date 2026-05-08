import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { PendingDoctorProfile } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'
import { DoctorPanel } from '../doctor/doctorUi'

export function AdminPendingDoctorsPage() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['admin-pending-doctors'],
    queryFn: async () => (await api.get<PendingDoctorProfile[]>('/api/admin/doctors/pending')).data,
  })

  const list = query.data ?? []

  return (
    <>
      <PageHeader title="Duyệt hồ sơ bác sĩ" />

      <DoctorPanel
        title="Danh sách hồ sơ chờ duyệt"
        description="Xem nhanh số lượng tài liệu, trạng thái hồ sơ và đi thẳng vào trang duyệt chi tiết."
      >
        <div className="doctor-metrics-grid">
          <div className="doctor-stat-card">
            <span className="doctor-stat-card__label">Tổng hồ sơ</span>
            <strong className="doctor-stat-card__value">{list.length}</strong>
            <span className="doctor-stat-card__hint">Các bác sĩ đang trong hàng chờ duyệt.</span>
          </div>
          <div className="doctor-stat-card">
            <span className="doctor-stat-card__label">Có tài liệu</span>
            <strong className="doctor-stat-card__value">{list.filter((d) => d.soLuongTaiLieu > 0).length}</strong>
            <span className="doctor-stat-card__hint">Những hồ sơ đã tải minh chứng.</span>
          </div>
          <div className="doctor-stat-card">
            <span className="doctor-stat-card__label">Chưa có tài liệu</span>
            <strong className="doctor-stat-card__value">{list.filter((d) => d.soLuongTaiLieu === 0).length}</strong>
            <span className="doctor-stat-card__hint">Cần kiểm tra kỹ trước khi phê duyệt.</span>
          </div>
          <div className="doctor-stat-card">
            <span className="doctor-stat-card__label">Trạng thái chờ</span>
            <strong className="doctor-stat-card__value">{list.length > 0 ? 'Đang xử lý' : 'Trống'}</strong>
            <span className="doctor-stat-card__hint">Danh sách được đồng bộ từ BE.</span>
          </div>
        </div>
      </DoctorPanel>

      {query.isLoading ? <div className="muted" style={{ marginTop: 16 }}>Đang tải…</div> : null}
      {query.isError ? <DoctorPanel><div className="doctor-notice doctor-notice--danger"><div><div className="doctor-notice__title">Không thể tải danh sách</div><p className="doctor-notice__description">{getApiErrorMessage(query.error)}</p></div></div></DoctorPanel> : null}

      {!query.isLoading && !query.isError && list.length === 0 ? (
        <DoctorPanel>
          <div className="doctor-empty-state">
            <div className="doctor-empty-state__icon">✓</div>
            <div className="doctor-empty-state__title">Không có hồ sơ chờ duyệt</div>
            <p className="doctor-empty-state__description">Hiện tại mọi hồ sơ bác sĩ đã được xử lý hoặc chưa có yêu cầu mới.</p>
          </div>
        </DoctorPanel>
      ) : null}

      <div className="doctor-list" style={{ marginTop: 16 }}>
        {list.map((d) => (
          <article key={d.maBacSi} className="doctor-list-card">
            <div className="doctor-list-card__header">
              <div>
                <h3 className="doctor-list-card__title">{d.hoTenDayDu}</h3>
                <p className="doctor-list-card__subtitle">
                  {d.chuyenKhoa} • CCHN: {d.maChungChiHanhNghe}
                </p>
              </div>
              <div className="doctor-chip-row">
                <span className="doctor-chip">Tài liệu: {d.soLuongTaiLieu}</span>
                <span className="doctor-chip">{d.trangThaiHoSo}</span>
              </div>
            </div>

            <div className="doctor-meta-list">
              <div className="doctor-meta-item">
                <span className="doctor-meta-item__label">Mã bác sĩ</span>
                <div className="doctor-meta-item__value">#{d.maBacSi}</div>
              </div>
              <div className="doctor-meta-item">
                <span className="doctor-meta-item__label">Số điện thoại</span>
                <div className="doctor-meta-item__value">{d.soDienThoai}</div>
              </div>
              <div className="doctor-meta-item">
                <span className="doctor-meta-item__label">Email</span>
                <div className="doctor-meta-item__value">{d.email}</div>
              </div>
              <div className="doctor-meta-item">
                <span className="doctor-meta-item__label">Trạng thái</span>
                <div className="doctor-meta-item__value">{d.trangThaiHoSo}</div>
              </div>
            </div>

            <div className="doctor-button-row">
              <button className="doctor-button doctor-button--primary" type="button" onClick={() => navigate(`/admin/doctors/${d.maBacSi}`)}>
                Xem chi tiết duyệt
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

