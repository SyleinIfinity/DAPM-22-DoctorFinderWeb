import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/http";
import type {
  AccountDoctorInfo,
  DoctorProfile,
  DoctorDocument,
} from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { createInitials } from "../doctor/doctorUi";
import {
  DoctorAvatar,
  DoctorPanel,
  DoctorPageHeading,
  getProfileStatusMeta,
  DoctorStatusBadge,
  DoctorNotice,
} from "../doctor/doctorUi";
import { getApiErrorMessage } from "../../utils/errors";

function normalizeAvatarUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (normalized.startsWith("data:")) return null;
  return normalized;
}

const STYLES = `
  .account-wrapper {
    --brand-primary: #7c3aed;
    --brand-grad: linear-gradient(135deg, #7c3aed 0%, #22c55e 100%);
    --bg-card: #ffffff;
    --border-color: #e5e7eb;
    --text-main: #1f2937;
    --text-muted: #6b7280;
    --input-bg: #f9fafb;
    color: var(--text-main);
    padding: 20px;
  }

  .member-profile-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
    margin-top: 24px;
  }

  .profile-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  /* AVATAR EDITING STYLES */
  .avatar-container {
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0 auto 16px;
    border-radius: 999px;
    overflow: hidden;
    background: #f3f4f6;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  }

  .avatar-circle {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    object-fit: cover;
    object-position: center center;
    border: 4px solid #f3f4f6;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 800;
    color: var(--brand-primary);
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 11px;
    font-weight: 700;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    cursor: pointer;
    text-transform: uppercase;
    text-align: center;
    padding: 10px;
  }

  .avatar-editable:hover .avatar-overlay {
    opacity: 1;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    background: #f3f4f6;
    font-size: 13px;
    color: var(--text-muted);
  }

  .info-group { display: grid; gap: 12px; }

  .info-item {
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    padding: 14px 18px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 700;
  }

  .info-value { font-size: 15px; font-weight: 600; }

  .btn-upgrade {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    background: var(--brand-grad);
    border: none;
    color: white;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    display: block;
    margin-top: 12px;
    text-decoration: none;
  }

  .input-custom {
    width: 100%;
    background: white;
    border: 1px solid #d1d5db;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
  }

  .icon-btn {
    background: #f3f4f6;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .icon-btn-save { background: var(--brand-primary); color: white; }

  @media (max-width: 850px) {
    .member-profile-grid { grid-template-columns: 1fr; }
  }
`;

type UserForm = {
  hoLot: string;
  ten: string;
  soDienThoai: string;
  email: string;
  cccd: string;
};

const USER_FIELDS: Array<{ k: keyof UserForm; label: string }> = [
  { k: "hoLot", label: "Họ lót" },
  { k: "ten", label: "Tên" },
  { k: "soDienThoai", label: "Số điện thoại" },
  { k: "email", label: "Email" },
  { k: "cccd", label: "Số CCCD/Định danh" },
];

export function AccountPage() {
  const qc = useQueryClient();
  const { session, setActivePortal } = useAuth();
  const maTaiKhoan = session?.maTaiKhoan ?? null;
  const maNguoiDung = session?.maNguoiDung ?? null;
  const activePortal = session?.activePortal ?? "member";
  const isDoctorContext = activePortal === "doctor";

  const [userForm, setUserForm] = useState<UserForm>({
    hoLot: "",
    ten: "",
    soDienThoai: "",
    email: "",
    cccd: "",
  });
  const [snapshot, setSnapshot] = useState<UserForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const memberAccountQuery = useQuery({
    queryKey: ["account", maTaiKhoan],
    queryFn: async () =>
      (
        await api.get<AccountDoctorInfo>(
          `/api/auth/account/${maTaiKhoan}/doctor`,
        )
      ).data,
    enabled: !!maTaiKhoan && !isDoctorContext,
  });

  const doctorProfileQuery = useQuery({
    queryKey: ["doctor-account-profile", maTaiKhoan],
    queryFn: async () =>
      (await api.get<DoctorProfile>(`/api/doctors/by-account/${maTaiKhoan}`))
        .data,
    enabled: !!maTaiKhoan && isDoctorContext,
  });

  const doctorDocumentsQuery = useQuery({
    queryKey: ["doctor-documents", doctorProfileQuery.data?.maBacSi],
    queryFn: async () =>
      (
        await api.get<DoctorDocument[]>(
          `/api/doctors/${doctorProfileQuery.data!.maBacSi}/documents`,
        )
      ).data,
    enabled: !!doctorProfileQuery.data?.maBacSi,
  });

  useEffect(() => {
    if (memberAccountQuery.data) {
      const d = memberAccountQuery.data;
      const next = {
        hoLot: d.hoLot || "",
        ten: d.ten || "",
        soDienThoai: d.soDienThoai || "",
        email: d.email || "",
        cccd: d.cccd || "",
      };
      setUserForm(next);
      setSnapshot(next);
    }
  }, [memberAccountQuery.data]);

  useEffect(
    () => () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error("Thiếu maNguoiDung");
      await api.put(`/api/users/${maNguoiDung}`, { ...userForm });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account", maTaiKhoan] });
      setSnapshot(userForm);
      setIsEditing(false);
      alert("Đã lưu thay đổi!");
    },
    onError: (err) => alert(getApiErrorMessage(err)),
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error("Thiếu maNguoiDung");
      if (!avatarFile) return null;
      const form = new FormData();
      form.append("avatar", avatarFile);
      return (await api.put(`/api/users/${maNguoiDung}/avatar`, form)).data as AccountDoctorInfo;
    },
    onSuccess: async () => {
      setAvatarPreview(null);
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await qc.invalidateQueries({ queryKey: ["account", maTaiKhoan] });
      alert("Đã cập nhật ảnh đại diện!");
    },
    onError: (err) => alert(getApiErrorMessage(err)),
  });

  const handleAvatarSelect = (file: File | null) => {
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const fullName = useMemo(
    () => `${userForm.hoLot} ${userForm.ten}`.trim() || "Thành viên",
    [userForm.hoLot, userForm.ten],
  );
  const currentAvatarUrl =
    normalizeAvatarUrl(
      memberAccountQuery.data?.anhDaiDien || doctorProfileQuery.data?.anhDaiDien,
    ) || null;
  const avatarUrl = avatarPreview || currentAvatarUrl;

  if (isDoctorContext) {
    const profile = doctorProfileQuery.data;
    const profileStatus = profile
      ? getProfileStatusMeta(profile.trangThaiHoSo)
      : null;

    return (
      <div className="account-wrapper">
        <style>{STYLES}</style>
        <DoctorPageHeading
          eyebrow="Quản lý chuyên môn"
          title="Hồ sơ Bác sĩ"
          description="Thông tin hành nghề và cơ sở y tế đang làm việc."
          actions={
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link
                className="doctor-button doctor-button--primary doctor-button-link"
                to="/doctor/account/update"
              >
                Cập nhật hồ sơ bác sĩ
              </Link>
              <button
                className="btn-upgrade"
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => setActivePortal("member")}
              >
                Về tài khoản cá nhân
              </button>
            </div>
          }
        />

        {profile ? (
          <>
            <DoctorPanel
              title="Tổng quan hồ sơ cá nhân"
              description="Toàn bộ thông tin nhận diện, hành nghề và chuyên môn của bác sĩ được gom vào một màn để dễ theo dõi hơn."
              className="account-doctor-overview"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(280px, 340px) 1fr",
                  gap: 24,
                  alignItems: "start",
                }}
              >
                <div className="profile-card" style={{ textAlign: "center" }}>
                  <DoctorAvatar
                    name={profile.hoTenDayDu}
                    imageUrl={profile.anhDaiDien}
                  />
                  <h3 style={{ margin: "15px 0 6px" }}>{profile.hoTenDayDu}</h3>
                  <div style={{ marginTop: 12 }}>
                    {profileStatus ? (
                      <DoctorStatusBadge
                        label={profileStatus.label}
                        tone={profileStatus.tone}
                      />
                    ) : null}
                  </div>
                </div>

                <div
                  className="doctor-meta-list"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                  }}
                >
                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Hồ sơ hành nghề
                    </span>
                    <div className="doctor-meta-item__value">
                      {profileStatus?.label ?? profile.trangThaiHoSo}
                    </div>
                    <div
                      className="doctor-meta-item__value"
                      style={{ marginTop: 4, fontSize: 13, fontWeight: 500 }}
                    >
                      {profileStatus?.description ?? ""}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">Chuyên khoa</span>
                    <div className="doctor-meta-item__value">
                      {profile.chuyenKhoa}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Trình độ chuyên môn
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.trinhDoChuyenMon}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Loại hình bác sĩ
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.loaiHinhBacSi}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Cơ sở công tác
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.tenCoSoYTe}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Địa chỉ làm việc
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.diaChiLamViec || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Kênh liên hệ
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.soDienThoai}
                    </div>
                    <div
                      className="doctor-meta-item__value"
                      style={{ marginTop: 4, fontSize: 13, fontWeight: 500 }}
                    >
                      {profile.email}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Mã chứng chỉ hành nghề
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.maChungChiHanhNghe}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Mô tả bản thân
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.moTaBanThan || "Chưa có mô tả giới thiệu."}
                    </div>
                  </div>

                  <div className="doctor-meta-item">
                    <span className="doctor-meta-item__label">
                      Tài khoản đăng nhập
                    </span>
                    <div className="doctor-meta-item__value">
                      {profile.tenDangNhap}
                    </div>
                  </div>
                </div>
              </div>
            </DoctorPanel>

            <DoctorPanel
              title="Minh chứng"
              description="Các tài liệu đính kèm trong hồ sơ bác sĩ."
            >
              {doctorDocumentsQuery.isLoading ? (
                <DoctorNotice
                  tone="info"
                  title="Đang tải…"
                  description="Đang tải danh sách minh chứng."
                />
              ) : null}

              {doctorDocumentsQuery.isError ? (
                <DoctorNotice
                  tone="danger"
                  title="Không thể tải danh sách"
                  description={getApiErrorMessage(doctorDocumentsQuery.error)}
                />
              ) : null}

              {!doctorDocumentsQuery.isLoading &&
              (doctorDocumentsQuery.data?.length ?? 0) === 0 ? (
                <DoctorNotice
                  tone="info"
                  title="Không có tài liệu"
                  description="Hồ sơ này hiện chưa đính kèm minh chứng."
                />
              ) : (
                <div className="doctor-list">
                  {(doctorDocumentsQuery.data ?? []).map((doc) => (
                    <article key={doc.maTaiLieu} className="doctor-list-card">
                      <div className="doctor-list-card__header">
                        <div>
                          <h3 className="doctor-list-card__title">
                            {doc.tieuDeTaiLieu}
                          </h3>
                          <p className="doctor-list-card__subtitle">
                            Mã tài liệu #{doc.maTaiLieu}
                          </p>
                        </div>
                        <span className="doctor-chip">Tài liệu</span>
                      </div>
                      <a
                        className="doctor-button doctor-button--secondary doctor-button-link"
                        href={doc.duongDanFileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở file
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </DoctorPanel>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="account-wrapper">
      <style>{STYLES}</style>
      <PageHeader title="Cài đặt tài khoản" />

      <div className="member-profile-grid">
        <aside className="stack" style={{ gap: "16px" }}>
          <section className="profile-card" style={{ textAlign: "center" }}>
            <div
              className={`avatar-container ${isEditing ? "avatar-editable" : ""}`}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <DoctorAvatar name={fullName} imageUrl={avatarUrl} size={140} />
              ) : (
                <div className="avatar-circle">{createInitials(fullName)}</div>
              )}

              {/* LỚP PHỦ HIỆN KHI CHỈNH SỬA */}
              {isEditing && (
                <div className="avatar-overlay">
                  <span style={{ fontSize: "24px" }}>📸</span>
                  <span>
                    Thay đổi
                    <br />
                    ảnh đại diện
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                handleAvatarSelect(file);
              }}
            />

            <h2 style={{ margin: "0 0 8px", fontSize: "20px" }}>{fullName}</h2>
            <div className="status-badge">
              {session?.trangThaiHoatDong === "HOAT_DONG"
                ? "● Trực tuyến"
                : "○ Ngoại tuyến"}
            </div>
          </section>

          <section className="profile-card" style={{ padding: "16px" }}>
            {memberAccountQuery.data?.trangThaiHoSo === "CHO_DUYET" ? (
              <Link
                to="/app/doctor-status"
                className="btn-upgrade"
                style={{ background: "#f3f4f6", color: "#6b7280" }}
              >
                Đang chờ duyệt hồ sơ bác sĩ
              </Link>
            ) : memberAccountQuery.data?.coTaiKhoanBacSi ||
              session?.vaiTro === "BAC_SI" ? (
              <button
                onClick={() => setActivePortal("doctor")}
                className="btn-upgrade"
              >
                Vào Portal Bác sĩ
              </button>
            ) : (
              <Link to="/app/doctor-status" className="btn-upgrade">
                Mở tài khoản Bác sĩ
              </Link>
            )}
          </section>
        </aside>

        <main className="profile-card">
          <div className="row-between" style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>
              👤 Thông tin chi tiết
            </h3>
            <div className="row">
              {isEditing ? (
                <div className="row" style={{ gap: "8px" }}>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setIsEditing(false);
                      if (snapshot) setUserForm(snapshot);
                      handleAvatarSelect(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    className="icon-btn icon-btn-save"
                    onClick={() => updateUserMutation.mutate()}
                  >
                    Lưu hồ sơ
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => updateAvatarMutation.mutate()}
                    disabled={!avatarFile || updateAvatarMutation.isPending}
                  >
                    {updateAvatarMutation.isPending ? "Đang cập nhật ảnh..." : "Lưu ảnh đại diện"}
                  </button>
                </div>
              ) : (
                <button className="icon-btn" type="button" onClick={() => setIsEditing(true)}>
                  ✎ Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="info-group">
            {USER_FIELDS.map((f) => (
              <div key={f.k} className="info-item">
                <span className="info-label">{f.label}</span>
                {isEditing ? (
                  <input
                    className="input-custom"
                    value={userForm[f.k]}
                    onChange={(e) =>
                      setUserForm({ ...userForm, [f.k]: e.target.value })
                    }
                  />
                ) : (
                  <span className="info-value">
                    {userForm[f.k] || "Chưa cập nhật"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
