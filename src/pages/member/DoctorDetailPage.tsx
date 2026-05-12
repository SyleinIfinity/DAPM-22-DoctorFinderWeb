import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";
import { api } from "../../api/http";
import { useState } from "react";
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

  // --- STATE CHO PHẦN VIẾT ĐÁNH GIÁ ---
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTextInput, setReviewTextInput] = useState("");

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

  // NÚT XỬ LÝ GỬI BÌNH LUẬN
  const handleSubmitReview = () => {
    if (!maNguoiDung) {
      alert("Vui lòng đăng nhập để đánh giá!");
      return;
    }
    if (!reviewTextInput.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }
    console.log("Gửi đánh giá:", { soSao: ratingInput, noiDung: reviewTextInput });
    alert("Cảm ơn bạn đã gửi đánh giá!");
    setIsWritingReview(false);
    setReviewTextInput("");
    setRatingInput(5);
  };

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
  const isFollowed = !!followsQuery.data?.some((followedDoctor) => followedDoctor.maBacSi === maBacSi);
  const isFollowingActionPending = followMutation.isPending || unfollowMutation.isPending;
  const initials = (doctor.hoTenDayDu || "BS").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "BS";
  const rating = ratingQuery.data;

  return (
    <main className="member-page-shell" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: '40px' }}>
      <PageHeader
        title="Hồ sơ Bác sĩ"
        right={<Link to="/app/home" className="member-link" style={{ color: '#2563eb', fontWeight: 'bold' }}>Tìm bác sĩ khác</Link>}
      />

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* === GRID CHIA 2 CỘT === */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* ========================================= */}
          {/* CỘT TRÁI (Vùng Trái Trên & Trái Dưới) */}
          {/* ========================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* [VÙNG TRÁI TRÊN] THÔNG TIN CƠ BẢN BÁC SĨ */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#4f46e5', flexShrink: 0, overflow: 'hidden', border: '3px solid #eff6ff' }}>
                  {doctor.anhDaiDien ? <img src={doctor.anhDaiDien} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                        {doctor.trinhDoChuyenMon || "Bác sĩ"}
                      </span>
                      <h2 style={{ fontSize: '22px', color: '#111827', margin: '4px 0 8px 0', fontWeight: 'bold', lineHeight: '1.2' }}>
                        {doctor.hoTenDayDu}
                      </h2>
                    </div>
                  </div>

                  <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>
                    Khoa: {doctor.chuyenKhoa}
                  </div>
                  <div style={{ color: '#4b5563', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    🏥 {doctor.tenCoSoYTe}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📍 {doctor.diaChiLamViec || "Chưa cập nhật địa chỉ"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <span style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '8px' }}>CCHN: {doctor.maChungChiHanhNghe}</span>
                </div>
                
                <button
                  type="button"
                  disabled={isFollowingActionPending || !maNguoiDung}
                  onClick={() => {
                    if (!maNguoiDung) return;
                    isFollowed ? unfollowMutation.mutate() : followMutation.mutate();
                  }}
                  style={{
                    padding: '8px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: isFollowed ? '#f3f4f6' : '#eff6ff',
                    color: isFollowed ? '#4b5563' : '#2563eb',
                    border: isFollowed ? '1px solid #d1d5db' : '1px solid #bfdbfe'
                  }}
                >
                  {isFollowingActionPending ? "..." : isFollowed ? "Đang theo dõi" : "♥ Theo dõi"}
                </button>
              </div>
            </div>

            {/* [VÙNG TRÁI DƯỚI] GIỚI THIỆU & MINH CHỨNG */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Giới thiệu */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 16px 0' }}>Giới thiệu chuyên môn</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {doctor.moTaBanThan || "Bác sĩ chưa cập nhật bài giới thiệu chi tiết."}
                </p>
              </div>

              {/* Bằng cấp / Minh chứng */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 16px 0' }}>Minh chứng & Bằng cấp</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {!documentsQuery.isLoading && (documentsQuery.data || []).length === 0 && (
                    <div style={{ gridColumn: 'span 2', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                      Chưa có minh chứng công khai.
                    </div>
                  )}
                  
                  {(documentsQuery.data || []).map((document) => (
                    <a
                      key={document.maTaiLieu}
                      href={document.duongDanFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontSize: '28px' }}>📄</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', lineHeight: '1.4' }}>{document.tieuDeTaiLieu}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Xem chi tiết</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* CỘT PHẢI (Vùng Phải - Đánh giá, Bình luận, Nút) */}
          {/* ========================================= */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
            
            {/* BẢNG ĐÁNH GIÁ & BÌNH LUẬN */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              
              {/* Box Tổng điểm */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', color: '#92400e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Đánh giá trung bình</span>
                <strong style={{ fontSize: '40px', color: '#d97706', lineHeight: '1' }}>⭐ {rating?.soSaoTrungBinh?.toFixed?.(1) ?? "0.0"}</strong>
                <span style={{ fontSize: '14px', color: '#b45309', marginTop: '8px' }}>Trên {rating?.tongDanhGia ?? 0} lượt đánh giá</span>
              </div>

              {/* Header Nút Viết Đánh Giá */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Bình luận gần đây</h3>
                <button 
                  onClick={() => setIsWritingReview(!isWritingReview)}
                  style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: isWritingReview ? '#f3f4f6' : '#ffffff', color: '#374151', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isWritingReview ? "Hủy" : "✎ Viết đánh giá"}
                </button>
              </div>

              {/* Form Viết Đánh Giá */}
              {isWritingReview && (
                <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 'bold' }}>Chọn sao:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setRatingInput(star)}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 2px', filter: star <= ratingInput ? 'none' : 'grayscale(100%) opacity(30%)' }}
                      >⭐</button>
                    ))}
                  </div>
                  
                  <textarea 
                    value={reviewTextInput}
                    onChange={(e) => setReviewTextInput(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    rows={3}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical', marginBottom: '12px' }}
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleSubmitReview}
                      style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}
                    >Gửi đánh giá</button>
                  </div>
                </div>
              )}

              {/* Danh sách bình luận */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {reviewQuery.isLoading && <div style={{ fontSize: '14px', color: '#6b7280' }}>Đang tải...</div>}
                {!reviewQuery.isLoading && (reviewQuery.data || []).length === 0 && (
                  <div style={{ padding: '24px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    Chưa có bình luận.
                  </div>
                )}
                
                {(reviewQuery.data || []).map((review) => (
                  <div key={review.maDanhGia} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>
                          {review.hoTenNguoiDung.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#374151', display: 'block' }}>{review.hoTenNguoiDung}</strong>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(review.thoiGian).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>⭐ {review.soSao}</span>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                      {review.noiDung || <i style={{ color: '#9ca3af' }}>Người dùng không để lại nội dung.</i>}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* KHỐI NÚT ĐẶT LỊCH / NHẮN TIN DÍNH (STICKY ACTION) */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', padding: '16px 24px', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', zIndex: 10 }}>

              <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', gap: '12px' }}>

                <button 

                  type="button" 

                  onClick={() => navigate(`/app/messages`)} 

                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: '#ffffff', color: '#374151', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}

                >

                  💬 Nhắn tin

                </button>

                <button 

                  type="button" 

                  onClick={() => navigate(`/app/doctors/${maBacSi}/slots`)} 

                  style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' }}

                >

                  🗓 Đặt lịch ngay

                </button>

              </div>

            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}