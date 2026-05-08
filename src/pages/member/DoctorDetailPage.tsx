import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";
import { api } from "../../api/http";
import type {
  DoctorDocument,
  DoctorProfile,
  FollowedDoctor,
  RatingSummary,
  Review,
} from "../../api/types";
import { getApiErrorMessage } from "../../utils/errors";
import { useAuth } from "../../auth/AuthContext";

export function DoctorDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session } = useAuth();
  const maBacSi = Number(params.maBacSi);
  const maNguoiDung = session?.maNguoiDung ?? null;

  const profileQuery = useQuery({
    queryKey: ["doctor-profile", maBacSi, session?.maTaiKhoan],
    queryFn: async () =>
      (
        await api.get<DoctorProfile>(`/api/doctors/${maBacSi}`, {
          params: session?.maTaiKhoan ? { viewerMaTaiKhoan: session.maTaiKhoan } : {},
        })
      ).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  });

  const ratingQuery = useQuery({
    queryKey: ["doctor-rating-summary", maBacSi],
    queryFn: async () => (await api.get<RatingSummary>(`/api/reviews/doctors/${maBacSi}/summary`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  });

  const reviewQuery = useQuery({
    queryKey: ["doctor-reviews", maBacSi],
    queryFn: async () => (await api.get<Review[]>(`/api/reviews/doctors/${maBacSi}`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  });

  const documentsQuery = useQuery({
    queryKey: ["doctor-documents-public", maBacSi],
    queryFn: async () =>
      (await api.get<DoctorDocument[]>(`/api/doctors/${maBacSi}/documents`)).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  });

  const followsQuery = useQuery({
    queryKey: ["follows", maNguoiDung],
    queryFn: async () =>
      (await api.get<FollowedDoctor[]>("/api/follows", { params: { maNguoiDung } }))
        .data,
    enabled: !!maNguoiDung,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error("Vui lòng đăng nhập member để theo dõi");
      return (
        await api.post(`/api/follows/${maBacSi}`, null, { params: { maNguoiDung } })
      ).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["follows", maNguoiDung] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error("Vui lòng đăng nhập member để bỏ theo dõi");
      return (
        await api.delete(`/api/follows/${maBacSi}`, { params: { maNguoiDung } })
      ).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["follows", maNguoiDung] });
    },
  });

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <main className="member-page-shell">
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="member-panel">URL không hợp lệ hoặc không tìm thấy bác sĩ.</div>
      </main>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <main className="member-page-shell">
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="member-panel">Đang tải hồ sơ…</div>
      </main>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <main className="member-page-shell">
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="member-panel member-panel--error">{getApiErrorMessage(profileQuery.error)}</div>
      </main>
    );
  }

  const doctor = profileQuery.data;
  const isFollowed =
    !!followsQuery.data?.some((followedDoctor) => followedDoctor.maBacSi === maBacSi);
  const isFollowingActionPending =
    followMutation.isPending || unfollowMutation.isPending;
  const initials =
    (doctor.hoTenDayDu || "BS")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BS";

  const rating = ratingQuery.data;

  return (
    <main className="member-page-shell">
      <PageHeader
        title="Hồ sơ bác sĩ"
        right={<Link to="/app/home" className="member-link">Tìm bác sĩ khác</Link>}
      />

      <section className="member-panel member-doctor-profile">
        <div className="member-doctor-profile__top">
          <div className="member-doctor-profile__avatar">
            {doctor.anhDaiDien ? <img src={doctor.anhDaiDien} alt="" /> : initials}
          </div>

          <div className="member-doctor-profile__info">
            <div className="member-doctor-profile__name">{doctor.hoTenDayDu}</div>
            <div className="member-doctor-profile__meta">{doctor.chuyenKhoa}</div>
            <div className="member-doctor-profile__meta">{doctor.tenCoSoYTe}</div>
            <div className="member-doctor-profile__meta">{doctor.diaChiLamViec || "Chưa cập nhật địa chỉ"}</div>

            <div className="member-doctor-profile__chips">
              <span className="member-chip">{doctor.trinhDoChuyenMon}</span>
              <span className="member-chip member-chip--soft">{doctor.trangThaiHoSo}</span>
              <span className="member-chip member-chip--soft">CCHN: {doctor.maChungChiHanhNghe}</span>
            </div>
            <div className="member-doctor-profile__chips" style={{ marginTop: 10 }}>
              <button
                type="button"
                className={isFollowed ? "btn btn-ghost" : "btn btn-primary"}
                disabled={isFollowingActionPending || !maNguoiDung}
                onClick={() => {
                  if (!maNguoiDung) return;
                  if (isFollowed) {
                    unfollowMutation.mutate();
                  } else {
                    followMutation.mutate();
                  }
                }}
              >
                {isFollowingActionPending
                  ? "Đang xử lý..."
                  : isFollowed
                    ? "Bỏ theo dõi"
                    : "Theo dõi bác sĩ"}
              </button>
              {!maNguoiDung ? (
                <span className="member-chip member-chip--soft">Đăng nhập để theo dõi</span>
              ) : null}
            </div>
            {followMutation.isError ? (
              <div className="member-empty-state member-empty-state--error">
                {getApiErrorMessage(followMutation.error)}
              </div>
            ) : null}
            {unfollowMutation.isError ? (
              <div className="member-empty-state member-empty-state--error">
                {getApiErrorMessage(unfollowMutation.error)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="member-doctor-profile__rating">
          <div className="member-panel__title">Đánh giá</div>
          <div className="member-rating-box">
            <strong>{rating?.soSaoTrungBinh?.toFixed?.(1) ?? "0.0"}</strong>
            <span>{rating?.tongDanhGia ?? 0} lượt đánh giá</span>
          </div>
        </div>

        <div className="member-doctor-profile__bio">
          <div className="member-panel__title">Giới thiệu</div>
          <p>{doctor.moTaBanThan || "Chưa có mô tả chi tiết."}</p>
        </div>

        <div className="member-doctor-profile__reviews">
          <div className="member-panel__title">Bình luận gần đây</div>
          <div className="member-review-list">
            {(reviewQuery.data || []).slice(0, 3).map((review) => (
              <article key={review.maDanhGia} className="member-review-card">
                <div className="member-review-card__head">
                  <strong>{review.hoTenNguoiDung}</strong>
                  <span>{review.soSao} sao</span>
                </div>
                <p>{review.noiDung || "Không có nội dung."}</p>
              </article>
            ))}
            {reviewQuery.isLoading ? <div className="member-empty-state">Đang tải bình luận…</div> : null}
            {!reviewQuery.isLoading && (reviewQuery.data || []).length === 0 ? (
              <div className="member-empty-state">Chưa có bình luận cho bác sĩ này.</div>
            ) : null}
          </div>
        </div>

        <div className="member-doctor-profile__reviews">
          <div className="member-panel__title">Minh chứng bác sĩ</div>
          <div className="member-review-list">
            {documentsQuery.isLoading ? (
              <div className="member-empty-state">Đang tải minh chứng…</div>
            ) : null}
            {documentsQuery.isError ? (
              <div className="member-empty-state member-empty-state--error">
                {getApiErrorMessage(documentsQuery.error)}
              </div>
            ) : null}
            {!documentsQuery.isLoading &&
            !documentsQuery.isError &&
            (documentsQuery.data || []).length === 0 ? (
              <div className="member-empty-state">Bác sĩ chưa có minh chứng công khai.</div>
            ) : null}
            {(documentsQuery.data || []).map((document) => (
              <article key={document.maTaiLieu} className="member-review-card">
                <div className="member-review-card__head">
                  <strong>{document.tieuDeTaiLieu}</strong>
                  <span>#{document.maTaiLieu}</span>
                </div>
                <a
                  href={document.duongDanFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="member-link"
                >
                  Xem minh chứng
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="member-sticky-actions">
        <button type="button" onClick={() => navigate(`/app/messages`)} className="btn btn-ghost">Nhắn tin</button>
        <button type="button" onClick={() => navigate(`/app/doctors/${maBacSi}/slots`)} className="btn btn-primary">Đặt lịch hẹn</button>
      </div>
    </main>
  );
}
