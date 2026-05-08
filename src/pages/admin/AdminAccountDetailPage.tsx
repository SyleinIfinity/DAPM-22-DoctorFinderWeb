import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminAccount, AdminAccountAction } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'
import { DoctorNotice, DoctorPanel, DoctorStatCard, DoctorStatusBadge } from '../doctor/doctorUi'

export function AdminAccountDetailPage() {
  const params = useParams()
  const maTaiKhoan = Number(params.maTaiKhoan)
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => (await api.get<AdminAccount[]>('/api/admin/accounts')).data,
  })

  const account = useMemo(() => {
    if (!Number.isFinite(maTaiKhoan) || maTaiKhoan <= 0) return null
    return (query.data || []).find((a) => a.maTaiKhoan === maTaiKhoan) || null
  }, [query.data, maTaiKhoan])

  const lock = useMutation({
    mutationFn: async () => (await api.patch<AdminAccountAction>(`/api/admin/accounts/${maTaiKhoan}/lock`)).data,
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const unlock = useMutation({
    mutationFn: async () => (await api.patch<AdminAccountAction>(`/api/admin/accounts/${maTaiKhoan}/unlock`)).data,
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const updateRole = useMutation({
    mutationFn: async (vaiTro: string) => (await api.patch<AdminAccountAction>(`/api/admin/accounts/${maTaiKhoan}/role`, { vaiTro })).data,
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!Number.isFinite(maTaiKhoan) || maTaiKhoan <= 0) {
    return (
      <>
        <PageHeader title="Chi tiết tài khoản" right={<Link to="/admin/accounts">Danh sách</Link>} />
        <DoctorPanel>
          <DoctorNotice tone="danger" title="URL không hợp lệ" description="Mã tài khoản trên đường dẫn không hợp lệ." />
        </DoctorPanel>
      </>
    )
  }

  return (
    <div className="doctor-page">
      <PageHeader title="Chi tiết tài khoản" right={<Link to="/admin/accounts">Danh sách</Link>} />

      {query.isLoading ? <DoctorNotice tone="info" title="Đang tải…" description="Hệ thống đang lấy dữ liệu tài khoản." /> : null}
      {query.isError ? <DoctorNotice tone="danger" title="Không thể tải tài khoản" description={getApiErrorMessage(query.error)} /> : null}
      {error ? <DoctorNotice tone="danger" title="Thao tác thất bại" description={error} /> : null}

      {account ? (
        <>
          <DoctorPanel title="Tổng quan tài khoản" description="Thông tin tài khoản, vai trò và trạng thái được gom vào một khu vực rõ ràng hơn.">
            <div className="doctor-metrics-grid">
              <DoctorStatCard label="Tài khoản" value={`#${account.maTaiKhoan}`} hint={account.tenDangNhap} />
              <DoctorStatCard label="Vai trò" value={account.vaiTro} hint="Quyền hiện tại trên hệ thống." />
              <DoctorStatCard label="Trạng thái" value={account.trangThaiHoatDong} hint="Tình trạng hoạt động của tài khoản." />
              <DoctorStatCard label="Liên kết BS" value={account.maBacSi ? `#${account.maBacSi}` : '—'} hint={account.trangThaiHoSoBacSi || 'Chưa có hồ sơ bác sĩ'} />
            </div>
          </DoctorPanel>

          <div className="doctor-request-grid" style={{ marginTop: 16 }}>
            <DoctorPanel title="Thông tin chi tiết" description="Các trường nền tảng để admin đối chiếu nhanh.">
              <div className="doctor-hero" style={{ marginTop: 0 }}>
                <div className="doctor-hero__content">
                  <div className="doctor-hero__eyebrow">Tài khoản hệ thống</div>
                  <h2 className="doctor-hero__title">#{account.maTaiKhoan} • {account.tenDangNhap}</h2>
                  <p className="doctor-hero__subtitle">
                    {account.hoTenNguoiDung || 'Chưa có họ tên'}
                    <br />
                    {account.email || 'Chưa có email'}
                  </p>
                </div>
                <div className="doctor-hero__aside">
                  <DoctorStatusBadge label={account.trangThaiHoatDong === 'KHOA' ? 'Locked' : 'Active'} tone={account.trangThaiHoatDong === 'KHOA' ? 'danger' : 'success'} />
                  <div className="doctor-keyfacts">
                    <div className="doctor-keyfact">
                      <span className="doctor-keyfact__label">Ngày tạo</span>
                      <span className="doctor-keyfact__value">{account.ngayTao}</span>
                    </div>
                    <div className="doctor-keyfact">
                      <span className="doctor-keyfact__label">SĐT</span>
                      <span className="doctor-keyfact__value">{account.soDienThoai || '—'}</span>
                    </div>
                    <div className="doctor-keyfact">
                      <span className="doctor-keyfact__label">Người dùng</span>
                      <span className="doctor-keyfact__value">{account.hoTenNguoiDung || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DoctorPanel>

            <DoctorPanel title="Điều khiển tài khoản" description="Khóa/mở khóa hoặc đổi quyền ngay trên trang chi tiết.">
              <div className="doctor-button-row">
                {account.trangThaiHoatDong === 'KHOA' ? (
                  <button className="doctor-button doctor-button--primary" type="button" disabled={unlock.isPending} onClick={() => unlock.mutate()}>
                    Mở khóa
                  </button>
                ) : (
                  <button className="doctor-button doctor-button--danger" type="button" disabled={lock.isPending} onClick={() => lock.mutate()}>
                    Khóa
                  </button>
                )}
                <button
                  className="doctor-button doctor-button--secondary"
                  type="button"
                  disabled={updateRole.isPending}
                  onClick={() => {
                    const next = prompt('Nhập vai trò mới (VD: NGUOI_DUNG/BAC_SI/QUAN_TRI_VIEN):', account.vaiTro)
                    if (!next) return
                    updateRole.mutate(next)
                  }}
                >
                  Đổi vai trò
                </button>
              </div>
            </DoctorPanel>
          </div>

          <DoctorPanel title="Liên kết bác sĩ" description="Thông tin hồ sơ bác sĩ nếu tài khoản này đã được nâng cấp.">
            {account.maBacSi ? (
              <div className="doctor-meta-list">
                <div className="doctor-meta-item"><span className="doctor-meta-item__label">Mã bác sĩ</span><div className="doctor-meta-item__value">#{account.maBacSi}</div></div>
                <div className="doctor-meta-item"><span className="doctor-meta-item__label">Trạng thái hồ sơ</span><div className="doctor-meta-item__value">{account.trangThaiHoSoBacSi || '—'}</div></div>
                <div className="doctor-meta-item"><span className="doctor-meta-item__label">Vai trò hệ thống</span><div className="doctor-meta-item__value">{account.vaiTro}</div></div>
                <div className="doctor-meta-item"><span className="doctor-meta-item__label">Trạng thái hoạt động</span><div className="doctor-meta-item__value">{account.trangThaiHoatDong}</div></div>
              </div>
            ) : (
              <DoctorNotice tone="info" title="Chưa có hồ sơ bác sĩ" description="Tài khoản này chỉ đang là người dùng hoặc chưa được nâng cấp thành bác sĩ." />
            )}
          </DoctorPanel>
        </>
      ) : (
        <DoctorPanel>
          <DoctorNotice tone="warning" title="Không tìm thấy tài khoản" description="Không có bản ghi nào khớp với mã tài khoản đã chọn." />
        </DoctorPanel>
      )}
    </div>
  )
}
