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
  queryFn: async () => {
    // Giả lập delay 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
    // Dữ liệu mẫu chuẩn FollowedDoctor
    return [
      {
        maBacSi: 1,
        hoTenBacSi: "BS. Nguyễn Văn Nhân",
        chuyenKhoa: "Nội khoa chuyên sâu",
        tenCoSoYTe: "Bệnh viện Đa khoa Thành phố",
        diaChiLamViec: "123 Đường ABC, Quận 1, TP.HCM"
      },
      {
        maBacSi: 2,
        hoTenBacSi: "BS. Lê Thị chuyên gia",
        chuyenKhoa: "Nhi khoa",
        tenCoSoYTe: "Bệnh viện Nhi Đồng 1",
        diaChiLamViec: "456 Đường XYZ, Quận 10, TP.HCM"
      }
    ];
  },
  enabled: true, // Để true để luôn xem được UI mẫu
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

