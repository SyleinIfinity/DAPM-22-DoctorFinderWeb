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
  DoctorPageHeading,
  getProfileStatusMeta,
  DoctorStatusBadge,
} from "../doctor/doctorUi";
import { getApiErrorMessage } from "../../utils/errors";

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
    border-radius: 32px;
    overflow: hidden;
  }

  .avatar-circle {
    width: 100%;
    height: 100%;
    border-radius: 32px;
    object-fit: cover;
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
  hoLot: string; ten: string; soDienThoai: string;
  email: string; cccd: string; anhDaiDien: string;
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
    hoLot: "", ten: "", soDienThoai: "", email: "", cccd: "", anhDaiDien: "",
  });
  const [snapshot, setSnapshot] = useState<UserForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const memberAccountQuery = useQuery({
    queryKey: ["account", maTaiKhoan],
    queryFn: async () => (await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`)).data,
    enabled: !!maTaiKhoan && !isDoctorContext,
  });

  const doctorProfileQuery = useQuery({
    queryKey: ["doctor-account-profile", maTaiKhoan],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/by-account/${maTaiKhoan}`)).data,
    enabled: !!maTaiKhoan && isDoctorContext,
  });

  useEffect(() => {
    if (memberAccountQuery.data) {
      const d = memberAccountQuery.data;
      const next = {
        hoLot: d.hoLot || "", ten: d.ten || "", soDienThoai: d.soDienThoai || "",
        email: d.email || "", cccd: d.cccd || "", anhDaiDien: d.anhDaiDien || "",
      };
      setUserForm(next);
      setSnapshot(next);
    }
  }, [memberAccountQuery.data]);

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

  const fullName = useMemo(() => `${userForm.hoLot} ${userForm.ten}`.trim() || "Thành viên", [userForm.hoLot, userForm.ten]);
  const avatarUrl = avatarPreview || userForm.anhDaiDien?.trim();

  if (isDoctorContext) {
    const profile = doctorProfileQuery.data;
    const profileStatus = profile ? getProfileStatusMeta(profile.trangThaiHoSo) : null;
    return (
      <div className="account-wrapper">
        <style>{STYLES}</style>
        <DoctorPageHeading
          eyebrow="Quản lý chuyên môn"
          title="Hồ sơ Bác sĩ"
          description="Thông tin hành nghề và cơ sở y tế đang làm việc."
          actions={<button className="btn-upgrade" style={{width: 'auto', padding: '10px 20px'}} onClick={() => setActivePortal("member")}>Về tài khoản cá nhân</button>}
        />
        {profile && (
          <div className="profile-card" style={{marginTop: '24px'}}>
             <div className="member-profile-grid">
                <div style={{textAlign: 'center'}}>
                  <DoctorAvatar name={profile.hoTenDayDu} imageUrl={profile.anhDaiDien} />
                  <h3 style={{marginTop: '15px'}}>{profile.hoTenDayDu}</h3>
                  <p style={{color: '#6b7280'}}>{profile.chuyenKhoa}</p>
                  {profileStatus && <DoctorStatusBadge label={profileStatus.label} tone={profileStatus.tone} />}
                </div>
                <div className="info-group">
                  <div className="info-item"><span className="info-label">Cơ sở y tế</span><span className="info-value">{profile.tenCoSoYTe}</span></div>
                  <div className="info-item"><span className="info-label">Trình độ chuyên môn</span><span className="info-value">{profile.trinhDoChuyenMon}</span></div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="account-wrapper">
      <style>{STYLES}</style>
      <PageHeader title="Cài đặt tài khoản" />

      <div className="member-profile-grid">
        <aside className="stack" style={{gap: '16px'}}>
          <section className="profile-card" style={{textAlign: 'center'}}>
            <div 
              className={`avatar-container ${isEditing ? 'avatar-editable' : ''}`}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} className="avatar-circle" alt="avatar" />
              ) : (
                <div className="avatar-circle">{createInitials(fullName)}</div>
              )}
              
              {/* LỚP PHỦ HIỆN KHI CHỈNH SỬA */}
              {isEditing && (
                <div className="avatar-overlay">
                  <span style={{fontSize: '24px'}}>📸</span>
                  <span>Thay đổi<br/>ảnh đại diện</span>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const res = typeof reader.result === "string" ? reader.result : "";
                  setAvatarPreview(res);
                  setUserForm(prev => ({ ...prev, anhDaiDien: res }));
                };
                reader.readAsDataURL(file);
              }
            }}/>
            
            <h2 style={{margin: '0 0 8px', fontSize: '20px'}}>{fullName}</h2>
            <div className="status-badge">
              {session?.trangThaiHoatDong === "HOAT_DONG" ? "● Trực tuyến" : "○ Ngoại tuyến"}
            </div>
          </section>

          <section className="profile-card" style={{padding: '16px'}}>
            {memberAccountQuery.data?.trangThaiHoSo === "CHO_DUYET" ? (
              <Link to="/app/doctor-status" className="btn-upgrade" style={{background: '#f3f4f6', color: '#6b7280'}}>Đang chờ duyệt hồ sơ bác sĩ</Link>
            ) : (memberAccountQuery.data?.coTaiKhoanBacSi || session?.vaiTro === "BAC_SI") ? (
              <button onClick={() => setActivePortal("doctor")} className="btn-upgrade">Vào Portal Bác sĩ</button>
            ) : (
              <Link to="/app/doctor-status" className="btn-upgrade">Mở tài khoản Bác sĩ</Link>
            )}
          </section>
        </aside>

        <main className="profile-card">
          <div className="row-between" style={{marginBottom: '20px'}}>
            <h3 style={{margin: 0, fontSize: '18px'}}>👤 Thông tin chi tiết</h3>
            <div className="row">
              {isEditing ? (
                <div className="row" style={{gap: '8px'}}>
                  <button className="icon-btn" onClick={() => { setIsEditing(false); if(snapshot) setUserForm(snapshot); setAvatarPreview(null); }}>Hủy</button>
                  <button className="icon-btn icon-btn-save" onClick={() => updateUserMutation.mutate()}>Lưu hồ sơ</button>
                </div>
              ) : (
                <button className="icon-btn" onClick={() => setIsEditing(true)}>✎ Chỉnh sửa</button>
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
                    onChange={e => setUserForm({...userForm, [f.k]: e.target.value})}
                  />
                ) : (
                  <span className="info-value">{userForm[f.k] || "Chưa cập nhật"}</span>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}