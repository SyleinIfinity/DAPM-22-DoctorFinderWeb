import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminAccount, AdminAccountAction } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

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
    mutationFn: async (vaiTro: string) =>
      (await api.patch<AdminAccountAction>(`/api/admin/accounts/${maTaiKhoan}/role`, { vaiTro })).data,
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
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Chi tiết tài khoản" right={<Link to="/admin/accounts">Danh sách</Link>} />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}
      {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

      {account ? (
        <div className="card stack">
          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>
                #{account.maTaiKhoan} • {account.tenDangNhap}
              </div>
              <div className="muted">
                role: <b>{account.vaiTro}</b> • trạng thái: <b>{account.trangThaiHoatDong}</b>
              </div>
            </div>
            <span className="chip">{account.trangThaiHoatDong}</span>
          </div>

          <div className="grid">
            <div className="stack">
              <div className="label">Ngày tạo</div>
              <div>{account.ngayTao}</div>
            </div>
            <div className="stack">
              <div className="label">Người dùng</div>
              <div>{account.hoTenNguoiDung || '—'}</div>
            </div>
            <div className="stack">
              <div className="label">Email</div>
              <div>{account.email || '—'}</div>
            </div>
            <div className="stack">
              <div className="label">SĐT</div>
              <div>{account.soDienThoai || '—'}</div>
            </div>
            <div className="stack">
              <div className="label">Bác sĩ</div>
              <div>
                {account.maBacSi ? `#${account.maBacSi} (${account.trangThaiHoSoBacSi || '—'})` : '—'}
              </div>
            </div>
          </div>

          <div className="row">
            {account.trangThaiHoatDong === 'KHOA' ? (
              <button className="btn btn-primary" type="button" disabled={unlock.isPending} onClick={() => unlock.mutate()}>
                Mở khóa
              </button>
            ) : (
              <button className="btn btn-danger" type="button" disabled={lock.isPending} onClick={() => lock.mutate()}>
                Khóa
              </button>
            )}
            <button
              className="btn"
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
        </div>
      ) : (
        <div className="card">Không tìm thấy tài khoản.</div>
      )}
    </>
  )
}
