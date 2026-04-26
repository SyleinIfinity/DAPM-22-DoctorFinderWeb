import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { FollowedDoctor } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function FollowsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null

  const query = useQuery({
    queryKey: ['follows', maNguoiDung],
    queryFn: async () =>
      (await api.get<FollowedDoctor[]>('/api/follows', { params: { maNguoiDung } })).data,
    enabled: !!maNguoiDung,
  })

  const unfollow = useMutation({
    mutationFn: async (maBacSi: number) => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      await api.delete(`/api/follows/${maBacSi}`, { params: { maNguoiDung } })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['follows', maNguoiDung] })
    },
  })

  return (
    <>
      <PageHeader title="Theo dõi" />

      {!maNguoiDung ? <div className="card">Thiếu maNguoiDung. Hãy đăng nhập lại.</div> : null}
      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}

      <div className="stack">
        {(query.data || []).length === 0 ? <div className="muted">Bạn chưa theo dõi bác sĩ nào.</div> : null}
        {(query.data || []).map((f) => (
          <div key={f.maBacSi} className="card row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{f.hoTenBacSi}</div>
              <div className="muted">
                {f.chuyenKhoa} • {f.tenCoSoYTe}
              </div>
              <div className="muted">{f.diaChiLamViec || '—'}</div>
            </div>
            <div className="row">
              <button className="btn" type="button" onClick={() => navigate(`/app/doctors/${f.maBacSi}`)}>
                Xem
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={unfollow.isPending}
                onClick={() => unfollow.mutate(f.maBacSi)}
              >
                Bỏ
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

