import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/http";
import type { AccountDoctorInfo, UpgradeToDoctorResponse } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";
import {
  DoctorAvatar,
  DoctorEmptyState,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  getProfileStatusMeta,
} from "../doctor/doctorUi";

// Định nghĩa kiểu cho tài liệu tải lên
type DocUpload = { id: number; title: string; file: File | null };
type DoctorFormState = {
  chuyenKhoa: string;
  trinhDoChuyenMon: string;
  maChungChiHanhNghe: string;
  loaiHinhBacSi: string;
  tenCoSoYTe: string;
  diaChiLamViec: string;
  moTaBanThan: string;
};

const specialtyOptions = [
  'Tim mạch',
  'Thần kinh',
  'Nha khoa',
  'Nhi khoa',
  'Tai mũi họng',
  'Da liễu',
  'Sản phụ khoa',
  'Cơ xương khớp',
  'Nội khoa',
  'Ngoại khoa',
  'Mắt',
  'Ung bướu',
];

type DoctorApiEnvelope = { data?: AccountDoctorInfo | null } | null;
type NoticeState = {
  tone: "success" | "danger" | "warning" | "info";
  title: string;
  description: string;
} | null;

function createDocUpload(): DocUpload {
  return { id: Date.now(), title: "", file: null };
}

function isDoctorInfo(value: unknown): value is AccountDoctorInfo {
  return !!value && typeof value === "object" && "trangThaiHoSo" in value;
}

function isDoctorApiEnvelope(value: unknown): value is DoctorApiEnvelope {
  return !!value && typeof value === "object" && "data" in value;
}

function getInitialDoctorForm(data?: AccountDoctorInfo | null): DoctorFormState {
  return {
    chuyenKhoa: data?.chuyenKhoa ?? "",
    trinhDoChuyenMon: data?.trinhDoChuyenMon ?? "",
    maChungChiHanhNghe: data?.maChungChiHanhNghe ?? "",
    loaiHinhBacSi: data?.loaiHinhBacSi ?? "",
    tenCoSoYTe: data?.tenCoSoYTe ?? "",
    diaChiLamViec: data?.diaChiLamViec ?? "",
    moTaBanThan: data?.moTaBanThan ?? "",
  };
}

function getActivityStatusMeta(status: string | null | undefined) {
  switch (status) {
    case "HOAT_DONG":
      return { label: "Đang hoạt động", tone: "success" as const };
    case "BI_KHOA":
      return { label: "Tài khoản bị khóa", tone: "danger" as const };
    case "CHO_DUYET":
      return { label: "Chờ kích hoạt", tone: "warning" as const };
    default:
      return { label: status ?? "Chưa xác định", tone: "neutral" as const };
  }
}

export function DoctorStatusPage() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const maTaiKhoan = session?.maTaiKhoan ?? null;

  // --- TRẠNG THÁI ĐĂNG KÝ ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [doctorForm, setDoctorForm] = useState<DoctorFormState>(getInitialDoctorForm(null));
  const [docs, setDocs] = useState<DocUpload[]>(() => [createDocUpload()]);
  const [notice, setNotice] = useState<NoticeState>(null);

  const query = useQuery({
    queryKey: ["doctor-status", maTaiKhoan],
    queryFn: async () => {
      if (!maTaiKhoan) throw new Error("Thiếu phiên đăng nhập");
      const response = await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`);
      return response.data;
    },
    enabled: !!maTaiKhoan,
  });

  const rawResponse: unknown = query.data ?? null;
  const doctorEnvelope = isDoctorApiEnvelope(rawResponse) ? rawResponse : null;
  const envelopeData = doctorEnvelope?.data ?? null;
  const rawData = isDoctorInfo(rawResponse)
    ? rawResponse
    : isDoctorInfo(envelopeData)
    ? envelopeData
    : null;
  const hasDoctorAccount = rawData?.coTaiKhoanBacSi ?? false;
  const hasPendingProfile = !hasDoctorAccount && (
    !!rawData?.trangThaiHoSo || rawData?.maBacSi != null || !!rawData?.chuyenKhoa || !!rawData?.tenCoSoYTe || !!rawData?.maChungChiHanhNghe
  );
  const hasDoctorRequest = hasDoctorAccount || hasPendingProfile;
  const activityStatus = rawData ? getActivityStatusMeta(rawData.trangThaiHoatDong) : null;
  const profileStatus = rawData?.trangThaiHoSo ? getProfileStatusMeta(rawData.trangThaiHoSo) : null;
  const errorMessage = query.isError ? getApiErrorMessage(query.error) : undefined;
  const shouldShowProfilePanel = hasDoctorRequest;

  // Xử lý vùng minh chứng
  const addDocRow = () =>
    setDocs((prev) => [...prev, createDocUpload()]);
  const removeDocRow = (id: number) => {
    if (docs.length > 1) setDocs(docs.filter((d) => d.id !== id));
  };

  const submitUpgrade = useMutation({
    mutationFn: async () => {
      if (!maTaiKhoan) throw new Error("Thiếu mã tài khoản");
      if (!doctorForm.chuyenKhoa.trim()) throw new Error("Vui lòng chọn chuyên khoa");
      if (!doctorForm.trinhDoChuyenMon.trim()) throw new Error("Vui lòng nhập trình độ chuyên môn");
      if (!doctorForm.loaiHinhBacSi.trim()) throw new Error("Vui lòng nhập loại hình bác sĩ");
      if (!doctorForm.tenCoSoYTe.trim()) throw new Error("Vui lòng nhập tên cơ sở y tế");
      if (!doctorForm.maChungChiHanhNghe.trim()) throw new Error("Vui lòng nhập mã chứng chỉ hành nghề");

      const formData = new FormData();
      formData.append("maTaiKhoan", String(maTaiKhoan));

      const doctorPayload = {
        chuyenKhoa: doctorForm.chuyenKhoa.trim(),
        trinhDoChuyenMon: doctorForm.trinhDoChuyenMon.trim(),
        loaiHinhBacSi: doctorForm.loaiHinhBacSi.trim(),
        tenCoSoYTe: doctorForm.tenCoSoYTe.trim(),
        diaChiLamViec: doctorForm.diaChiLamViec.trim() || null,
        maChungChiHanhNghe: doctorForm.maChungChiHanhNghe.trim(),
        moTaBanThan: doctorForm.moTaBanThan.trim() || null,
      };
      formData.append(
        "thongTinBacSi",
        new Blob([JSON.stringify(doctorPayload)], { type: "application/json" }),
      );

      const validDocs = docs.filter((doc) => doc.file);
      for (const doc of validDocs) {
        const fallbackTitle = doc.file?.name ?? "Tai lieu minh chung";
        formData.append("tieuDeTaiLieu", doc.title.trim() || fallbackTitle);
        formData.append("files", doc.file as File);
      }

      const response = await api.post<UpgradeToDoctorResponse>(
        "/api/auth/upgrade-to-doctor",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    },
    onSuccess: async (response) => {
      setNotice({
        tone: response.upgraded ? "success" : "warning",
        title: response.upgraded ? "Đã gửi hồ sơ bác sĩ" : "Không thể gửi hồ sơ",
        description: response.message,
      });
      if (response.upgraded) {
        setIsRegistering(false);
        setDocs([createDocUpload()]);
      }
      await qc.invalidateQueries({ queryKey: ["doctor-status", maTaiKhoan] });
    },
    onError: (error) => {
      setNotice({
        tone: "danger",
        title: "Gửi hồ sơ thất bại",
        description: getApiErrorMessage(error),
      });
    },
  });

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Account"
        title="Trạng thái hồ sơ"
        description="Thông tin tài khoản và hồ sơ bác sĩ liên kết với phiên đăng nhập hiện tại."
        actions={
          <Link
            className="doctor-button doctor-button--secondary doctor-button-link"
            to="/app/account"
            style={{ color: "#000" }}
          >
            Chỉnh sửa hồ sơ
          </Link>
        }
      />

      {query.isLoading ? <DoctorNotice tone="info" title="Đang tải thông tin" description="Hệ thống đang lấy dữ liệu..." /> : null}
      {query.isError ? <DoctorNotice tone="danger" title="Không tải được dữ liệu" description={errorMessage ?? "Có lỗi xảy ra khi truy xuất hồ sơ bác sĩ."} /> : null}
      {notice ? <DoctorNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}
      {!maTaiKhoan ? <DoctorNotice tone="warning" title="Chưa đăng nhập" description="Vui lòng đăng nhập để xem trạng thái hồ sơ bác sĩ." /> : null}
      {!query.isLoading && !query.isError && !rawData ? (
        <DoctorNotice
          tone="info"
          title="Không có hồ sơ bác sĩ"
          description="Tài khoản hiện tại chưa có hồ sơ bác sĩ hoặc dữ liệu chưa đồng bộ."
        />
      ) : null}

      {hasPendingProfile ? (
        <DoctorNotice
          tone="warning"
          title="Hồ sơ đang chờ duyệt"
          description="Bác sĩ đã gửi hồ sơ, hệ thống đang chờ xét duyệt. Vui lòng đợi quản trị xác nhận."
        />
      ) : null}

      {rawData ? (
        <>
          {isRegistering ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "25px",
                marginBottom: "30px",
              }}
            >
              <DoctorPanel title="Thông tin chuyên môn (Theo thiết kế ERD)">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">CHUYÊN KHOA</span>
                      <select
                        value={doctorForm.chuyenKhoa}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, chuyenKhoa: e.target.value }))}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000', background: '#fff' }}
                      >
                        <option value="">Chọn chuyên khoa</option>
                        {specialtyOptions.map((specialty) => (
                          <option key={specialty} value={specialty}>{specialty}</option>
                        ))}
                      </select>
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">TRÌNH ĐỘ CHUYÊN MÔN</span>
                      <input
                        type="text"
                        value={doctorForm.trinhDoChuyenMon}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, trinhDoChuyenMon: e.target.value }))}
                        placeholder="Vd: Thạc sĩ, CK1..."
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }}
                      />
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">MÃ CCHN (UNIQUE)</span>
                      <input
                        type="text"
                        value={doctorForm.maChungChiHanhNghe}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, maChungChiHanhNghe: e.target.value }))}
                        placeholder="Nhập số CCHN"
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }}
                      />
                    </div>
                    <div className="doctor-meta-item">
                      <span className="doctor-meta-item__label">LOẠI HÌNH BÁC SĨ</span>
                      <input
                        type="text"
                        value={doctorForm.loaiHinhBacSi}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, loaiHinhBacSi: e.target.value }))}
                        placeholder="Vd: Bác sĩ tư vấn"
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }}
                      />
                    </div>
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">TÊN CƠ SỞ Y TẾ & ĐỊA CHỈ</span>
                    <input
                      type="text"
                      value={doctorForm.tenCoSoYTe}
                      onChange={(e) => setDoctorForm(prev => ({ ...prev, tenCoSoYTe: e.target.value }))}
                      placeholder="Tên bệnh viện"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000', marginBottom: '10px' }}
                    />
                    <input
                      type="text"
                      value={doctorForm.diaChiLamViec}
                      onChange={(e) => setDoctorForm(prev => ({ ...prev, diaChiLamViec: e.target.value }))}
                      placeholder="Địa chỉ cơ sở"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000' }}
                    />
                  </div>
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">MÔ TẢ BẢN THÂN</span>
                    <textarea
                      value={doctorForm.moTaBanThan}
                      onChange={(e) => setDoctorForm(prev => ({ ...prev, moTaBanThan: e.target.value }))}
                      placeholder="Giới thiệu kinh nghiệm..."
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', color: '#000', minHeight: '80px' }}
                    />
                  </div>
                </div>
              </DoctorPanel>

              <DoctorPanel
                title="Vùng tải lên minh chứng"
                aside={
                  <button
                    onClick={addDocRow}
                    style={{
                      color: "#24D5DB",
                      background: "none",
                      border: "none",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    + Thêm tài liệu
                  </button>
                }
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        backgroundColor: "#F9FAFB",
                        padding: "10px",
                        borderRadius: "12px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Tiêu đề minh chứng"
                        value={d.title}
                        onChange={(e) =>
                          setDocs((prev) =>
                            prev.map((item) =>
                              item.id === d.id ? { ...item, title: e.target.value } : item,
                            ),
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                        }}
                      />
                      <input
                        type="file"
                        style={{ flex: 1 }}
                        onChange={(e) =>
                          setDocs((prev) =>
                            prev.map((item) =>
                              item.id === d.id
                                ? { ...item, file: e.target.files?.[0] ?? null }
                                : item,
                            ),
                          )
                        }
                      />
                      <button
                        onClick={() => removeDocRow(d.id)}
                        style={{
                          color: "#FF4D4F",
                          border: "none",
                          background: "none",
                          fontWeight: "bold",
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    className="doctor-button doctor-button--secondary"
                    style={{ flex: 1, color: '#000', fontWeight: 'bold' }}
                    onClick={() => setIsRegistering(false)}
                  >
                    Hủy
                  </button>
                  <button 
                    className="doctor-button doctor-button--primary" 
                    style={{ flex: 1, color: '#000', fontWeight: 'bold' }}
                    disabled={submitUpgrade.isPending}
                    onClick={() => submitUpgrade.mutate()}
                  >
                    {submitUpgrade.isPending
                      ? "Đang gửi..."
                      : hasDoctorAccount
                      ? "Cập nhật hồ sơ"
                      : "Gửi hồ sơ duyệt"}
                  </button>
                </div>
              </DoctorPanel>
            </div>
          ) : shouldShowProfilePanel ? (
            <>
              {/* --- HÀNG 1: HERO --- */}
              <section className="doctor-hero">
                <div className="doctor-hero__content">
                  <div className="doctor-hero__eyebrow">Thông tin tài khoản</div>
                  <h2 className="doctor-hero__title">{rawData.hoLot} {rawData.ten}</h2>
                  <p className="doctor-hero__subtitle">{rawData.email}</p>
                  <div className="doctor-button-row">
                    {hasDoctorAccount ? (
                      <Link className="doctor-button doctor-button--primary doctor-button-link" to={`/app/doctors/${rawData.maBacSi}`} style={{ color: '#000' }}>
                        Xem hồ sơ công khai
                      </Link>
                    ) : null}
                    <button
                      className="doctor-button doctor-button--secondary"
                      style={{ color: '#000', cursor: 'pointer' }}
                      onClick={() => {
                        setDoctorForm(getInitialDoctorForm(rawData));
                        setIsRegistering(true);
                      }}
                    >
                      {hasDoctorAccount ? "Cập nhật hồ sơ bác sĩ" : "Cập nhật thông tin hồ sơ"}
                    </button>
                  </div>
                </div>

                <div className="doctor-hero__aside">
                  <div className="doctor-profile-strip">
                    <DoctorAvatar name={`${rawData.hoLot} ${rawData.ten}`} />
                    <div>
                      <h3 className="doctor-profile-strip__name">{rawData.hoLot} {rawData.ten}</h3>
                      <p className="doctor-profile-strip__meta">{rawData.chuyenKhoa || 'Chưa cập nhật'}<br />{rawData.tenCoSoYTe || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  {profileStatus && <DoctorStatusBadge label={profileStatus.label} tone={profileStatus.tone} />}
                  <div className="doctor-keyfacts">
                    <div className="doctor-keyfact"><span className="doctor-keyfact__label">Mã hồ sơ bác sĩ</span><span className="doctor-keyfact__value">{hasDoctorAccount ? `#${rawData.maBacSi}` : 'Chưa có'}</span></div>
                    <div className="doctor-keyfact"><span className="doctor-keyfact__label">Mã CCHN</span><span className="doctor-keyfact__value">{rawData.maChungChiHanhNghe || 'Chưa có'}</span></div>
                  </div>
                </div>
              </section>

              <section className="doctor-metrics-grid">
                <DoctorStatCard label="Tài khoản" value={activityStatus?.label ?? "—"} hint="Trạng thái truy cập hệ thống." />
                <DoctorStatCard label="Hồ sơ bác sĩ" value={profileStatus?.label ?? "—"} hint={profileStatus?.description ?? "Kiểm tra hồ sơ định kỳ."} />
                <DoctorStatCard label="Chuyên khoa" value={rawData.chuyenKhoa ?? "Chưa cập nhật"} hint="Hiển thị với bệnh nhân." />
                <DoctorStatCard label="Cơ sở y tế" value={rawData.tenCoSoYTe ?? "Chưa cập nhật"} hint="Bệnh viện đang công tác." />
              </section>

              {hasDoctorAccount ? (
                <DoctorPanel title="Dữ liệu hồ sơ hiện tại">
                  <div className="doctor-meta-list">
                    <div className="doctor-meta-item"><span className="doctor-meta-item__label">Họ tên bác sĩ</span><div className="doctor-meta-item__value">{rawData.hoLot} {rawData.ten}</div></div>
                    <div className="doctor-meta-item"><span className="doctor-meta-item__label">Mã chứng chỉ</span><div className="doctor-meta-item__value">{rawData.maChungChiHanhNghe}</div></div>
                    <div className="doctor-meta-item"><span className="doctor-meta-item__label">Nơi công tác</span><div className="doctor-meta-item__value">{rawData.tenCoSoYTe}</div></div>
                  </div>
                </DoctorPanel>
              ) : null}
            </>
          ) : (
            <DoctorPanel title="Hồ sơ bác sĩ">
              <DoctorEmptyState 
                title="Bạn chưa có hồ sơ bác sĩ" 
                description="Bắt đầu đăng ký để tham gia hệ thống khám chữa bệnh."
                action={<button className="doctor-button doctor-button--primary" style={{ color: '#000' }} onClick={() => setIsRegistering(true)}>Bắt đầu đăng ký ngay</button>} 
              />
            </DoctorPanel>
          )}
        </>
      ) : null}
    </div>
  );
}
