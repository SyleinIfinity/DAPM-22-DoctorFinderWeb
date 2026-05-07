import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/http";
import type { DoctorProfile } from "../../api/types";
import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";

const specialties = ["Tim mạch", "Thần kinh", "Nha khoa", "Nhi khoa", "Tai mũi họng", "Da liễu", "Sản phụ khoa", "Cơ xương khớp", "Nội khoa", "Ngoại khoa", "Mắt", "Ung bướu"];

export function DoctorSearchPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [specialty, setSpecialty] = useState<string>("");
  const [submitted, setSubmitted] = useState(true);

  const query = useQuery({
    queryKey: ["doctor-search", keyword, specialty, session?.maTaiKhoan, submitted],
    queryFn: async () => {
      const params: Record<string, string | number> = { trangThaiHoSo: "DA_DUYET", limit: 24, offset: 0 };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (specialty) params.chuyenKhoa = specialty;
      if (session?.maTaiKhoan) params.viewerMaTaiKhoan = session.maTaiKhoan;
      return (await api.get<DoctorProfile[]>("/api/doctors/search", { params })).data;
    },
    enabled: submitted,
  });

  const list = useMemo(() => query.data || [], [query.data]);

  return (
    <main className="member-page-shell">
      <PageHeader title="Tìm kiếm bác sĩ" right={<button className="btn btn-ghost" onClick={() => navigate("/app/home")}>Trang chủ</button>} />
      <section className="member-panel member-search-panel">
        <div className="member-search-panel__grid">
          <div className="member-search-panel__field">
            <span className="member-search-panel__label">Từ khóa</span>
            <input className="member-input" placeholder="Tên bác sĩ, cơ sở, triệu chứng..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setSubmitted(true); }} />
          </div>
          <div className="member-search-panel__field">
            <span className="member-search-panel__label">Chuyên khoa</span>
            <select className="member-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">Tất cả chuyên khoa</option>
              {specialties.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="member-search-panel__actions">
            <button className="btn btn-outline" onClick={() => { setKeyword(""); setSpecialty(""); setSubmitted(true); }}>Xoá lọc</button>
            <button className="btn btn-primary" onClick={() => setSubmitted(true)}>Tìm kiếm</button>
          </div>
        </div>
      </section>
      <section className="member-panel">
        <div className="member-panel__header">
          <div>
            <div className="member-panel__title">Kết quả tìm kiếm</div>
            <div className="member-panel__subtitle">{`${list.length} bác sĩ phù hợp`}</div>
          </div>
        </div>
        {query.isError ? <div className="member-empty-state member-empty-state--error">{getApiErrorMessage(query.error)}</div> : null}
        {query.isLoading ? <div className="member-empty-state">Đang tải dữ liệu bác sĩ…</div> : null}
        {!query.isLoading && list.length === 0 ? <div className="member-empty-state">Không tìm thấy bác sĩ phù hợp.</div> : null}
        <div className="member-doctor-list">
          {list.map((doctor) => (
            <article key={doctor.maBacSi} className="member-doctor-card" onClick={() => navigate(`/app/doctors/${doctor.maBacSi}`)}>
              <div className="member-doctor-card__avatar">{doctor.anhDaiDien ? <img src={doctor.anhDaiDien} alt="" /> : <span>{doctor.hoTenDayDu.slice(0, 2).toUpperCase()}</span>}</div>
              <div className="member-doctor-card__body">
                <h3>{doctor.hoTenDayDu}</h3>
                <p>{doctor.chuyenKhoa} • {doctor.tenCoSoYTe}</p>
                <p className="member-doctor-card__muted">{doctor.diaChiLamViec || "Chưa cập nhật địa chỉ"}</p>
              </div>
              <div className="member-doctor-card__cta"><button className="btn btn-ghost" type="button">Xem hồ sơ</button></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
