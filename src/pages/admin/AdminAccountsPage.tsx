import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AdminAccount, AdminAccountAction } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function AdminAccountsPage() {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

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

  const list = useMemo(() => query.data || [], [query.data])

  return (
    <>
      <PageHeader title="Quản lý tài khoản" />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}
      {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

      <div className="stack">
        {list.map((a) => (
          <div key={a.maTaiKhoan} className="card stack">
            <div className="row-between">
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 900 }}>
                  #{a.maTaiKhoan} • {a.tenDangNhap}
                </div>
                <div className="muted">
                  role: <b>{a.vaiTro}</b> • trạng thái: <b>{a.trangThaiHoatDong}</b>
                </div>
                {a.hoTenNguoiDung ? <div className="muted">Người dùng: {a.hoTenNguoiDung}</div> : null}
                {a.maBacSi ? <div className="muted">Bác sĩ: #{a.maBacSi} ({a.trangThaiHoSoBacSi || '—'})</div> : null}
              </div>
              <span className="chip">{a.trangThaiHoatDong}</span>
            </div>

            <div className="row">
              <Link className="btn" to={`/admin/accounts/${a.maTaiKhoan}`}>
                Chi tiết
              </Link>
              {a.trangThaiHoatDong === 'KHOA' ? (
                <button className="btn btn-primary" type="button" disabled={unlock.isPending} onClick={() => unlock.mutate(a.maTaiKhoan)}>
                  Mở khóa
                </button>
              ) : (
                <button className="btn btn-danger" type="button" disabled={lock.isPending} onClick={() => lock.mutate(a.maTaiKhoan)}>
                  Khóa
                </button>
              )}
              <button
                className="btn"
                type="button"
                disabled={updateRole.isPending}
                onClick={() => {
                  const next = prompt('Nhập vai trò mới (VD: NGUOI_DUNG/BAC_SI/QUAN_TRI_VIEN):', a.vaiTro)
                  if (!next) return
                  updateRole.mutate({ maTaiKhoan: a.maTaiKhoan, vaiTro: next })
                }}
              >
                Đổi vai trò
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
