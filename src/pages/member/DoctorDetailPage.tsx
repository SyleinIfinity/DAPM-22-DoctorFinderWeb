import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { ConversationSummary, DoctorProfile, FollowedDoctor, RatingSummary, Review } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function DoctorDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session } = useAuth()

  const maBacSi = Number(params.maBacSi)
  const maNguoiDung = session?.maNguoiDung ?? null

  const [actionError, setActionError] = useState<string | null>(null)

  const doctorQuery = useQuery({
    queryKey: ['doctor', maBacSi],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/${maBacSi}`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  })

  const ratingQuery = useQuery({
    queryKey: ['doctor-rating', maBacSi],
    queryFn: async () => (await api.get<RatingSummary>(`/api/doctors/${maBacSi}/rating-summary`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  })

  const reviewsQuery = useQuery({
    queryKey: ['doctor-reviews', maBacSi],
    queryFn: async () => (await api.get<Review[]>(`/api/doctors/${maBacSi}/reviews`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  })

  const followsQuery = useQuery({
    queryKey: ['follows', maNguoiDung],
    queryFn: async () =>
      (await api.get<FollowedDoctor[]>('/api/follows', { params: { maNguoiDung } })).data,
    enabled: !!maNguoiDung,
  })

  const isFollowed = useMemo(() => {
    const list = followsQuery.data || []
    return list.some((f) => f.maBacSi === maBacSi)
  }, [followsQuery.data, maBacSi])

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      await api.post(`/api/follows/${maBacSi}`, null, { params: { maNguoiDung } })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['follows', maNguoiDung] })
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      await api.delete(`/api/follows/${maBacSi}`, { params: { maNguoiDung } })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['follows', maNguoiDung] })
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      const res = await api.post<ConversationSummary>('/api/conversations', { maNguoiDung, maBacSi })
      return res.data
    },
    onSuccess: (data) => {
      navigate(`/app/messages/${data.maCuocHoiThoai}`)
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <>
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  if (doctorQuery.isLoading) {
    return (
      <>
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="muted">Đang tải…</div>
      </>
    )
  }

  if (doctorQuery.isError || !doctorQuery.data) {
    return (
      <>
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(doctorQuery.error)}
        </div>
      </>
    )
  }

  const doctor = doctorQuery.data
  const rating = ratingQuery.data

  return (
    <>
      <PageHeader title="Hồ sơ bác sĩ" right={<Link to="/app/home">Tìm bác sĩ</Link>} />

      <div className="card stack">
        <div className="row-between">
          <div className="stack" style={{ gap: 4 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{doctor.hoTenDayDu}</div>
            <div className="muted">
              {doctor.chuyenKhoa} • {doctor.trinhDoChuyenMon}
            </div>
            <div className="muted">{doctor.tenCoSoYTe}</div>
            <div className="muted">{doctor.diaChiLamViec || '—'}</div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
            <span className="chip">Hồ sơ: {doctor.trangThaiHoSo}</span>
            {rating ? (
              <span className="chip">
                ⭐ {rating.soSaoTrungBinh ?? 0} ({rating.tongDanhGia})
              </span>
            ) : (
              <span className="chip">Chưa có đánh giá</span>
            )}
          </div>
        </div>

        {doctor.moTaBanThan ? <div className="muted">{doctor.moTaBanThan}</div> : null}

        {actionError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {actionError}
          </div>
        ) : null}

        <div className="row">
          <button className="btn btn-primary" type="button" onClick={() => navigate(`/app/doctors/${maBacSi}/slots`)}>
            Đặt lịch
          </button>
          <button
            className="btn"
            type="button"
            disabled={!maNguoiDung || createConversationMutation.isPending}
            onClick={() => createConversationMutation.mutate()}
          >
            {createConversationMutation.isPending ? 'Đang mở…' : 'Nhắn tin'}
          </button>
          {isFollowed ? (
            <button
              className="btn btn-danger"
              type="button"
              disabled={!maNguoiDung || unfollowMutation.isPending}
              onClick={() => unfollowMutation.mutate()}
            >
              Bỏ theo dõi
            </button>
          ) : (
            <button
              className="btn"
              type="button"
              disabled={!maNguoiDung || followMutation.isPending}
              onClick={() => followMutation.mutate()}
            >
              Theo dõi
            </button>
          )}
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="card stack">
        <div className="title">Đánh giá</div>
        {reviewsQuery.isLoading ? <div className="muted">Đang tải…</div> : null}
        {reviewsQuery.data && reviewsQuery.data.length === 0 ? (
          <div className="muted">Chưa có đánh giá.</div>
        ) : null}
        {(reviewsQuery.data || []).slice(0, 10).map((r) => (
          <div key={r.maDanhGia} className="card">
            <div className="row-between">
              <div style={{ fontWeight: 800 }}>{r.hoTenNguoiDung}</div>
              <span className="chip">⭐ {r.soSao}</span>
            </div>
            {r.noiDung ? <div className="muted" style={{ marginTop: 6 }}>{r.noiDung}</div> : null}
          </div>
        ))}
      </div>
    </>
  )
}

