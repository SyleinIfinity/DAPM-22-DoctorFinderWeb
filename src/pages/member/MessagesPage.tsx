import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { ConversationSummary } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function MessagesPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const role = (session?.vaiTro || '').toUpperCase()
  const isDoctor = role === 'BAC_SI'
  const base = isDoctor ? '/doctor' : '/app'

  const maNguoiDung = session?.maNguoiDung ?? null
  const maBacSi = session?.maBacSi ?? null

  const params = isDoctor ? { maBacSi } : { maNguoiDung }
  const enabled = isDoctor ? !!maBacSi : !!maNguoiDung

  const query = useQuery({
    queryKey: ['conversations', isDoctor ? 'doctor' : 'user', isDoctor ? maBacSi : maNguoiDung],
    queryFn: async () => (await api.get<ConversationSummary[]>('/api/conversations', { params })).data,
    enabled,
  })

  const sorted = useMemo(() => {
    const list = query.data || []
    return [...list].sort((a, b) => {
      const ta = a.thoiGianGuiCuoi ? new Date(a.thoiGianGuiCuoi).getTime() : 0
      const tb = b.thoiGianGuiCuoi ? new Date(b.thoiGianGuiCuoi).getTime() : 0
      return tb - ta
    })
  }, [query.data])

  return (
    <>
      <PageHeader title="Nhắn tin" />

      {!enabled ? <div className="card">Thiếu ID (maNguoiDung/maBacSi). Hãy đăng nhập lại.</div> : null}
      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}

      <div className="stack">
        {sorted.length === 0 ? <div className="muted">Chưa có hội thoại.</div> : null}
        {sorted.map((c) => {
          const title = isDoctor ? c.hoTenBenhNhan : c.hoTenBacSi
          const subtitle = isDoctor ? 'Bệnh nhân' : `${c.chuyenKhoa} • ${c.tenCoSoYTe}`
          return (
            <div key={c.maCuocHoiThoai} className="card row-between">
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 900 }}>{title}</div>
                <div className="muted">{subtitle}</div>
                {c.noiDungCuoi ? <div className="muted">Tin nhắn cuối: {c.noiDungCuoi}</div> : null}
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => navigate(`${base}/messages/${c.maCuocHoiThoai}`)}
              >
                Mở
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

