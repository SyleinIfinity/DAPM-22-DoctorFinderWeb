import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/http";
import type { AccountDoctorInfo, DoctorProfile } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { createInitials } from "../doctor/doctorUi";
import {
  DoctorAvatar,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  getProfileStatusMeta,
} from "../doctor/doctorUi";
import { getApiErrorMessage } from "../../utils/errors";

type UserForm = {
  hoLot: string;
  ten: string;
  soDienThoai: string;
  email: string;
  cccd: string;
  anhDaiDien: string;
};

const USER_FIELDS: Array<{
  k: keyof UserForm;
  label: string;
  editable?: boolean;
}> = [
  { k: "hoLot", label: "Họ lót" },
  { k: "ten", label: "Tên" },
  { k: "soDienThoai", label: "Số điện thoại" },
  { k: "email", label: "Email" },
  { k: "cccd", label: "CCCD" },
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
    anhDaiDien: "",
  });
  const [snapshot, setSnapshot] = useState<UserForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  useEffect(() => {
    if (!memberAccountQuery.data) return;
    const d = memberAccountQuery.data;
    const next: UserForm = {
      hoLot: d.hoLot || "",
      ten: d.ten || "",
      soDienThoai: d.soDienThoai || "",
      email: d.email || "",
      cccd: d.cccd || "",
      anhDaiDien: d.anhDaiDien || "",
    };
    setUserForm(next);
    setSnapshot(next);
    setAvatarPreview(null);
  }, [memberAccountQuery.data]);

  // --- Logic cập nhật User ---
  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error("Thiếu maNguoiDung");
      await api.put(`/api/users/${maNguoiDung}`, { ...userForm });
    },
    onSuccess: () => {
      alert("Cập nhật hồ sơ cá nhân thành công");
      qc.invalidateQueries({ queryKey: ["account", maTaiKhoan] });
      setSnapshot(userForm);
      setIsEditing(false);
    },
    onError: (err) => alert(getApiErrorMessage(err)),
  });

  const fullName = useMemo(
    () => `${userForm.hoLot} ${userForm.ten}`.trim() || "Thành viên",
    [userForm.hoLot, userForm.ten],
  );
  const avatarUrl = avatarPreview || userForm.anhDaiDien?.trim();
  const statusLabel =
    session?.trangThaiHoatDong === "HOAT_DONG" ? "ONLINE" : "OFFLINE";
  const doctorInfo = memberAccountQuery.data;
  const hasDoctorProfile =
    !!doctorInfo?.coTaiKhoanBacSi ||
    !!doctorInfo?.maBacSi ||
    (session?.vaiTro || "").toUpperCase() === "BAC_SI";
  const pendingDoctorProfile = doctorInfo?.trangThaiHoSo === "CHO_DUYET";

  const switchToMember = () => {
    setActivePortal("member");
  };

  const handleCancelEdit = () => {
    if (snapshot) setUserForm(snapshot);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const handlePickAvatar = () => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
      setUserForm((prev) => ({ ...prev, anhDaiDien: result }));
    };
    reader.readAsDataURL(file);
  };

  if (isDoctorContext) {
    const profile = doctorProfileQuery.data;
    const profileStatus = profile
      ? getProfileStatusMeta(profile.trangThaiHoSo)
      : null;

    return (
      <div className="doctor-page">
        <DoctorPageHeading
          eyebrow="Doctor account"
          title="Hồ sơ bác sĩ"
          description="Thông tin hành nghề và hồ sơ chuyên môn của bạn đang được hiển thị từ backend."
          actions={
            <button
              type="button"
              className="doctor-button doctor-button--secondary"
              onClick={switchToMember}
            >
              Chuyển sang tài khoản người dùng
            </button>
          }
        />

        {doctorProfileQuery.isLoading ? (
          <DoctorNotice
            tone="info"
            title="Đang tải hồ sơ bác sĩ"
            description="Hệ thống đang lấy thông tin hồ sơ hành nghề từ backend."
          />
        ) : null}

        {doctorProfileQuery.isError ? (
          <DoctorNotice
            tone="danger"
            title="Không thể tải hồ sơ bác sĩ"
            description={getApiErrorMessage(doctorProfileQuery.error)}
          />
        ) : null}

        {profile ? (
          <>
            <section className="doctor-hero">
              <div className="doctor-hero__content">
                <div className="doctor-hero__eyebrow">Thông tin hành nghề</div>
                <h2 className="doctor-hero__title">{profile.hoTenDayDu}</h2>
                <p className="doctor-hero__subtitle">
                  {profile.chuyenKhoa} · {profile.trinhDoChuyenMon}
                </p>
                <div className="doctor-button-row">
                  <button
                    type="button"
                    className="doctor-button doctor-button--secondary"
                    onClick={switchToMember}
                  >
                    Chuyển sang tài khoản người dùng
                  </button>
                </div>
              </div>

              <div className="doctor-hero__aside">
                <div className="doctor-profile-strip">
                  <DoctorAvatar
                    name={profile.hoTenDayDu}
                    imageUrl={profile.anhDaiDien}
                  />
                  <div>
                    <h3 className="doctor-profile-strip__name">
                      {profile.hoTenDayDu}
                    </h3>
                    <p className="doctor-profile-strip__meta">
                      {profile.chuyenKhoa}
                      <br />
                      {profile.tenCoSoYTe}
                    </p>
                  </div>
                </div>
                {profileStatus ? (
                  <DoctorStatusBadge
                    label={profileStatus.label}
                    tone={profileStatus.tone}
                  />
                ) : null}
                <div className="doctor-keyfacts">
                  <div className="doctor-keyfact">
                    <span className="doctor-keyfact__label">Mã bác sĩ</span>
                    <span className="doctor-keyfact__value">
                      #{profile.maBacSi}
                    </span>
                  </div>
                  <div className="doctor-keyfact">
                    <span className="doctor-keyfact__label">
                      Địa chỉ làm việc
                    </span>
                    <span className="doctor-keyfact__value">
                      {profile.diaChiLamViec || "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="doctor-stat-grid">
              <DoctorStatCard
                label="Trạng thái hồ sơ"
                value={profileStatus?.label ?? profile.trangThaiHoSo}
                hint={profileStatus?.description}
              />
              <DoctorStatCard
                label="Chuyên khoa"
                value={profile.chuyenKhoa}
                hint="Hiển thị với bệnh nhân."
              />
              <DoctorStatCard
                label="Cơ sở y tế"
                value={profile.tenCoSoYTe}
                hint={
                  profile.diaChiLamViec ||
                  "Địa chỉ làm việc sẽ hiển thị khi được cập nhật."
                }
              />
              <DoctorStatCard
                label="Loại hình"
                value={profile.loaiHinhBacSi}
                hint="Loại hình bác sĩ."
              />
            </section>

            <DoctorPanel
              title="Thông tin chuyên môn"
              description="Các thông tin dùng để nhận diện hồ sơ bác sĩ trên hệ thống."
            >
              <div className="doctor-meta-list">
                <div className="doctor-meta-item">
                  <span className="doctor-meta-item__label">Họ và tên</span>
                  <div className="doctor-meta-item__value">
                    {profile.hoTenDayDu}
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
                    {profile.moTaBanThan || "Chưa có mô tả."}
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
            </DoctorPanel>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="member-cv">
      <PageHeader title="Hồ sơ cá nhân" />

      <div className="member-profile-grid">
        <section className="member-profile-card member-profile-card--left">
          <button
            type="button"
            className={
              isEditing
                ? "member-cv__portrait member-cv__portrait--editable"
                : "member-cv__portrait"
            }
            onClick={handlePickAvatar}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="member-cv__avatar member-cv__avatar--large"
              />
            ) : (
              <div className="member-cv__avatar member-cv__avatar--placeholder member-cv__avatar--large">
                {createInitials(fullName)}
              </div>
            )}
            <span className="member-cv__avatar-hint">
              Thay đổi ảnh đại diện
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
          <div className="member-profile-name">{fullName}</div>
          <div className="member-profile-status">
            <span className="member-cv__label">Trạng thái hoạt động</span>
            <span className="member-cv__value">{statusLabel}</span>
          </div>
        </section>

        <div className="member-profile-right">
          <section className="member-profile-card member-profile-card--action">
            <div className="member-profile-action-list">
              {pendingDoctorProfile ? (
                <Link
                  to="/app/doctor-status"
                  className="member-profile-upgrade member-profile-upgrade--status"
                >
                  Xem trạng thái hồ sơ
                </Link>
              ) : hasDoctorProfile ? (
                <button
                  type="button"
                  onClick={() => setActivePortal("doctor")}
                  className="member-profile-upgrade"
                >
                  Chuyển sang tài khoản bác sĩ
                </button>
              ) : (
                <Link
                  to="/app/doctor-status"
                  className="member-profile-upgrade member-profile-upgrade--outline"
                >
                  Mở tài khoản bác sĩ
                </Link>
              )}
            </div>
          </section>

          <section className="member-profile-card member-profile-card--details">
            <div className="member-cv__panel-header">
              <div className="member-cv__panel-title">Hồ sơ cá nhân</div>
              <div className="member-cv__actions">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="member-cv__icon-button"
                      onClick={handleCancelEdit}
                      aria-label="Hủy chỉnh sửa"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      className="member-cv__icon-button member-cv__icon-button--primary"
                      onClick={() => updateUserMutation.mutate()}
                      disabled={updateUserMutation.isPending}
                      aria-label="Lưu hồ sơ"
                    >
                      ✓
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="member-cv__icon-button"
                    onClick={() => setIsEditing(true)}
                    aria-label="Chỉnh sửa hồ sơ"
                  >
                    ✎
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="member-cv__form">
                {USER_FIELDS.map((f) => (
                  <label className="member-cv__field" key={f.k}>
                    <span className="member-cv__label">{f.label}</span>
                    <input
                      className="member-cv__input"
                      value={userForm[f.k]}
                      onChange={(e) =>
                        setUserForm({ ...userForm, [f.k]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="member-profile-info">
                {USER_FIELDS.map((f) => (
                  <div className="member-cv__info" key={f.k}>
                    <span className="member-cv__label">{f.label}</span>
                    <span className="member-cv__value">
                      {userForm[f.k] || "Chưa cập nhật"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
