import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/http";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { getApiErrorMessage } from "../../utils/errors";
import type { FollowedDoctor } from "../../api/types";

export function FollowsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session } = useAuth();
  const maNguoiDung = session?.maNguoiDung ?? null;
  const [activeTab, setActiveTab] = useState<"FOLLOWED" | "RECENT">("FOLLOWED");
  const [keyword, setKeyword] = useState("");

  const followedQuery = useQuery({
    queryKey: ["follows", maNguoiDung],
    queryFn: async () => (await api.get<FollowedDoctor[]>("/api/follows", { params: { maNguoiDung } })).data,
    enabled: activeTab === "FOLLOWED" && !!maNguoiDung,
  });

  const recentQuery = useQuery({
    queryKey: ["recent-doctors", maNguoiDung],
    queryFn: async () => {
      const res = await api.get("/api/doctors/search", { params: { limit: 12, offset: 0, trangThaiHoSo: "DA_DUYET", ...(maNguoiDung ? { viewerMaTaiKhoan: session?.maTaiKhoan } : {}) } });
      return (res.data || []).slice(0, 6);
    },
    enabled: activeTab === "RECENT",
  });

  const unfollow = useMutation({
    mutationFn: async (maBacSi: number) => {
      if (!maNguoiDung) throw new Error("Thiếu maNguoiDung");
      return (await api.delete(`/api/follows/${maBacSi}`, { params: { maNguoiDung } })).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follows", maNguoiDung] }),
  });

  const follow = useMutation({
    mutationFn: async (maBacSi: number) => {
      if (!maNguoiDung) throw new Error("Thiếu maNguoiDung");
      return (await api.post(`/api/follows/${maBacSi}`, null, { params: { maNguoiDung } })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follows", maNguoiDung] });
      qc.invalidateQueries({ queryKey: ["recent-doctors", maNguoiDung] });
    },
  });

  const currentData = activeTab === "FOLLOWED" ? followedQuery.data : recentQuery.data;
  const isLoading = activeTab === "FOLLOWED" ? followedQuery.isLoading : recentQuery.isLoading;
  const filtered = (currentData || []).filter((item: any) => {
    if (!keyword.trim()) return true;
    const text = `${item.hoTenBacSi || item.hoTenDayDu || ""} ${item.chuyenKhoa || ""} ${item.tenCoSoYTe || ""}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  return (
    <div className="member-page-shell">
      <PageHeader title="Bác sĩ của bạn" />
      <section className="member-panel">
        <div style={{ position: "relative", marginBottom: "18px" }}>
          <input className="member-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={activeTab === "FOLLOWED" ? "Tìm trong danh sách theo dõi..." : "Tìm trong bác sĩ vừa xem..."} />
        </div>
        <div className="member-tabs">
          <button onClick={() => setActiveTab("FOLLOWED")} className={activeTab === "FOLLOWED" ? "member-tab member-tab--active" : "member-tab"}>Đã theo dõi</button>
          <button onClick={() => setActiveTab("RECENT")} className={activeTab === "RECENT" ? "member-tab member-tab--active" : "member-tab"}>Vừa xem gần đây</button>
        </div>
        {followedQuery.isError || recentQuery.isError ? <div className="member-empty-state member-empty-state--error">{getApiErrorMessage(followedQuery.error || recentQuery.error)}</div> : null}
        {isLoading ? <div className="member-empty-state">Đang tải dữ liệu...</div> : null}
        {!isLoading && filtered.length === 0 ? <div className="member-empty-state">{activeTab === "FOLLOWED" ? "Bạn chưa theo dõi bác sĩ nào." : "Bạn chưa xem hồ sơ bác sĩ nào gần đây."}</div> : null}
        <div className="member-doctor-list">
          {filtered.map((f: any) => {
            const name = f.hoTenBacSi || f.hoTenDayDu || "BS";
            const avatarUrl = f.anhDaiDien ?? f.anhDaiDienBacSi ?? null;

            return (
              <article key={f.maBacSi} className="member-doctor-card" onClick={() => navigate(`/app/doctors/${f.maBacSi}`)}>
                <div className="member-doctor-card__avatar">
                  {avatarUrl ? <img src={avatarUrl} alt={name} /> : <span>{name.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="member-doctor-card__body">
                  <h3>{name}</h3>
                  <p>{f.chuyenKhoa} • {f.tenCoSoYTe || ""}</p>
                  <p className="member-doctor-card__muted">{f.diaChiLamViec || "Chưa cập nhật địa chỉ"}</p>
                </div>
                <div className="member-doctor-card__cta">
                  <button className="btn btn-ghost" type="button" onClick={(e) => { e.stopPropagation(); activeTab === "FOLLOWED" ? unfollow.mutate(f.maBacSi) : follow.mutate(f.maBacSi); }}>
                    {activeTab === "FOLLOWED" ? "Bỏ theo dõi" : "Theo dõi"}
                  </button>
                  <button className="btn btn-primary" type="button" onClick={(e) => { e.stopPropagation(); navigate(`/app/doctors/${f.maBacSi}/slots`); }}>Đặt lịch</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
