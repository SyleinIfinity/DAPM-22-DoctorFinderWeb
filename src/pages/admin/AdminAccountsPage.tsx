import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminAccount, AdminAccountAction } from '../../api/types'
import { getApiErrorMessage } from '../../utils/errors'
import { DoctorNotice, DoctorPanel, DoctorStatCard } from '../doctor/doctorUi'

type AccountSegment = 'all' | 'member' | 'doctor'

const SEGMENTS: Array<{ id: AccountSegment; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'member', label: 'Người dùng' },
  { id: 'doctor', label: 'Bác sĩ' },
]

export function AdminAccountsPage() {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [segment, setSegment] = useState<AccountSegment>('all')

  const query = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => (await api.get<AdminAccount[]>('/api/admin/accounts')).data,
  })

  const lock = useMutation({
    mutationFn: async (maTaiKhoan: number) => (await api.patch<AdminAccountAction>(`/api/admin/accounts/${maTaiKhoan}/lock`)).data,
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const unlock = useMutation({
    mutationFn: async (maTaiKhoan: number) => (await api.patch<AdminAccountAction>(`/api/admin/accounts/${maTaiKhoan}/unlock`)).data,
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const updateRole = useMutation({
    mutationFn: async ({ maTaiKhoan, vaiTro }: { maTaiKhoan: number; vaiTro: string }) =>
      (await api.patch<AdminAccountAction>(`/api/admin/accounts/${maTaiKhoan}/role`, { vaiTro })).data,
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const list = useMemo(() => {
    const raw = query.data || []
    if (segment === 'doctor') return raw.filter((a) => a.maBacSi != null)
    if (segment === 'member') return raw.filter((a) => a.maBacSi == null)
    return raw
  }, [query.data, segment])

  const totals = useMemo(() => {
    const raw = query.data || []
    return {
      all: raw.length,
      member: raw.filter((a) => a.maBacSi == null).length,
      doctor: raw.filter((a) => a.maBacSi != null).length,
    }
  }, [query.data])

  return (
    <div className="doctor-page">
      <DoctorPanel
        title="Quản lý tài khoản"
        description="Danh sách người dùng, bác sĩ và quyền hạn hiển thị theo dạng bảng gọn hơn, tránh card quá cao như trước."
      >
        <div className="doctor-metrics-grid">
          <DoctorStatCard label="Tổng tài khoản" value={String(totals.all)} hint="Toàn bộ tài khoản trong hệ thống." />
          <DoctorStatCard label="Người dùng" value={String(totals.member)} hint="Tài khoản chưa có hồ sơ bác sĩ." />
          <DoctorStatCard label="Bác sĩ" value={String(totals.doctor)} hint="Tài khoản có hồ sơ bác sĩ liên kết." />
          <DoctorStatCard label="Bộ lọc" value={segment === 'all' ? 'Tất cả' : segment === 'member' ? 'Người dùng' : 'Bác sĩ'} hint="Giúp tập trung vào từng nhóm." />
        </div>

        <div className="doctor-button-row" style={{ marginTop: 16, justifyContent: 'flex-start' }}>
          {SEGMENTS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={segment === t.id ? 'doctor-button doctor-button--primary' : 'doctor-button doctor-button--secondary'}
              onClick={() => setSegment(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </DoctorPanel>

      {query.isLoading ? <div className="muted" style={{ marginTop: 16 }}>Đang tải…</div> : null}

      {query.isError ? (
        <DoctorNotice tone="danger" title="Không thể tải tài khoản" description={getApiErrorMessage(query.error)} />
      ) : null}

      {error ? <DoctorNotice tone="danger" title="Thao tác thất bại" description={error} /> : null}

      {!query.isLoading && list.length === 0 ? (
        <DoctorPanel>
          <div className="doctor-empty-state">
            <div className="doctor-empty-state__icon">∅</div>
            <div className="doctor-empty-state__title">Không có tài khoản trong nhóm đã chọn</div>
            <p className="doctor-empty-state__description">Hãy chuyển sang bộ lọc khác hoặc kiểm tra lại dữ liệu từ BE.</p>
          </div>
        </DoctorPanel>
      ) : null}

      {list.length > 0 ? (
        <DoctorPanel
          title="Danh sách tài khoản"
          description="Mỗi dòng hiển thị ngắn gọn để admin quét nhanh và thao tác trực tiếp."
          aside={<span className="doctor-count-bubble">{list.length}</span>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--c-ink-3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '0 12px' }}>Tài khoản</th>
                  <th style={{ padding: '0 12px' }}>Thông tin</th>
                  <th style={{ padding: '0 12px' }}>Trạng thái</th>
                  <th style={{ padding: '0 12px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const isDoctor = a.maBacSi != null
                  const roleLabel = a.vaiTro === 'QUAN_TRI_VIEN' ? 'Admin' : a.vaiTro === 'BAC_SI' ? 'Bác sĩ' : 'Người dùng'
                  const roleClass = a.vaiTro === 'QUAN_TRI_VIEN' ? 'doctor-badge--danger' : a.vaiTro === 'BAC_SI' ? 'doctor-badge--info' : 'doctor-badge--success'
                  const statusClass = a.trangThaiHoatDong === 'KHOA' ? 'doctor-badge--danger' : 'doctor-badge--success'
                  const doctorStatusLabel =
                    a.trangThaiHoSoBacSi === 'DA_DUYET'
                      ? 'Đã duyệt'
                      : a.trangThaiHoSoBacSi === 'CHO_DUYET'
                        ? 'Chờ duyệt'
                        : a.trangThaiHoSoBacSi === 'TU_CHOI'
                          ? 'Từ chối'
                          : '—'
                  const doctorStatusClass =
                    a.trangThaiHoSoBacSi === 'DA_DUYET'
                      ? 'doctor-badge--success'
                      : a.trangThaiHoSoBacSi === 'CHO_DUYET'
                        ? 'doctor-badge--warning'
                        : a.trangThaiHoSoBacSi === 'TU_CHOI'
                          ? 'doctor-badge--danger'
                          : 'doctor-badge--neutral'

                  return (
                    <tr key={a.maTaiKhoan} style={{ background: 'var(--c-surface)', boxShadow: 'var(--shadow-sm)' }}>
                      <td style={{ padding: '14px 12px', borderRadius: '14px 0 0 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <strong style={{ fontSize: 14 }}>{a.tenDangNhap}</strong>
                          <span style={{ color: 'var(--c-ink-3)', fontSize: 12 }}>#{a.maTaiKhoan}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.hoTenNguoiDung || 'Chưa có họ tên'}</div>
                          <div style={{ color: 'var(--c-ink-3)', fontSize: 12 }}>
                            {a.email || 'Chưa có email'}
                            {a.maBacSi ? ` • BS #${a.maBacSi}` : ''}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <div className="doctor-chip-row">
                          <span className={`doctor-badge ${roleClass}`}>{roleLabel}</span>
                          <span className={`doctor-badge ${statusClass}`}>{a.trangThaiHoatDong === 'KHOA' ? 'Locked' : 'Active'}</span>
                          {isDoctor ? <span className={`doctor-badge ${doctorStatusClass}`}>{doctorStatusLabel}</span> : null}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', borderRadius: '0 14px 14px 0' }}>
                        <div className="doctor-button-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                          <Link className="doctor-button doctor-button--secondary doctor-button-link" to={`/admin/accounts/${a.maTaiKhoan}`}>
                            Chi tiết
                          </Link>
                          <button
                            className={a.trangThaiHoatDong === 'KHOA' ? 'doctor-button doctor-button--primary' : 'doctor-button doctor-button--danger'}
                            type="button"
                            disabled={lock.isPending || unlock.isPending || updateRole.isPending}
                            onClick={() => {
                              if (a.trangThaiHoatDong === 'KHOA') unlock.mutate(a.maTaiKhoan)
                              else lock.mutate(a.maTaiKhoan)
                            }}
                          >
                            {a.trangThaiHoatDong === 'KHOA' ? 'Mở khóa' : 'Khóa'}
                          </button>
                          <button
                            className="doctor-button doctor-button--secondary"
                            type="button"
                            disabled={lock.isPending || unlock.isPending || updateRole.isPending}
                            onClick={() => {
                              const next = prompt('Nhập vai trò mới (VD: NGUOI_DUNG/BAC_SI/QUAN_TRI_VIEN):', a.vaiTro)
                              if (!next) return
                              updateRole.mutate({ maTaiKhoan: a.maTaiKhoan, vaiTro: next })
                            }}
                          >
                            Đổi quyền
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </DoctorPanel>
      ) : null}
    </div>
  )
}
