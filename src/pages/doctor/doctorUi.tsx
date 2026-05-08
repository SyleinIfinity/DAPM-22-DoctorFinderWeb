import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

type StatusMeta = {
  label: string;
  tone: Tone;
  description?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function humanizeToken(value: string | null | undefined) {
  if (!value) return "Chưa cập nhật";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return "Chưa xác định";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(
    "vi-VN",
    options ?? { day: "2-digit", month: "2-digit", year: "numeric" },
  ).format(parsed);
}

export function formatLongDate(value: string | null | undefined) {
  return formatDate(value, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(value: string | null | undefined) {
  return formatDate(value);
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "--:--";
  return value.slice(0, 5);
}

export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function createInitials(name: string | null | undefined) {
  if (!name) return "BS";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "BS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[words.length - 1][0] ?? ""}`.toUpperCase();
}

export function getProfileStatusMeta(
  status: string | null | undefined,
): StatusMeta {
  switch (status) {
    case "DA_DUYET":
      return {
        label: "Đã duyệt hồ sơ",
        tone: "success",
        description: "Bạn có thể nhận và xử lý lịch hẹn bình thường.",
      };
    case "CHO_DUYET":
      return {
        label: "Chờ duyệt hồ sơ",
        tone: "warning",
        description: "Hồ sơ đang được kiểm tra trước khi kích hoạt đầy đủ.",
      };
    case "TU_CHOI":
      return {
        label: "Hồ sơ bị từ chối",
        tone: "danger",
        description: "Cần bổ sung hoặc điều chỉnh thông tin và tài liệu.",
      };
    default:
      return {
        label: humanizeToken(status),
        tone: "info",
        description:
          "Kiểm tra lại trạng thái hồ sơ để đảm bảo vận hành ổn định.",
      };
  }
}

export function getScheduleStatusMeta(
  status: string | null | undefined,
): StatusMeta {
  switch (status) {
    case "SAP_DIEN_RA":
      return { label: "Sắp diễn ra", tone: "info" };
    case "DANG_DIEN_RA":
      return { label: "Đang diễn ra", tone: "success" };
    case "TAM_DUNG_NHAN_LICH":
      return { label: "Tạm dừng nhận lịch", tone: "warning" };
    case "DA_HUY":
      return { label: "Đã hủy", tone: "danger" };
    default:
      return { label: humanizeToken(status), tone: "neutral" };
  }
}

export function getAppointmentStatusMeta(
  status: string | null | undefined,
): StatusMeta {
  switch (status) {
    case "CHO_XAC_NHAN":
      return { label: "Chờ xác nhận", tone: "warning" };
    case "DA_DUYET":
      return { label: "Đã đồng ý", tone: "success" };
    case "TU_CHOI":
      return { label: "Đã từ chối", tone: "danger" };
    case "DA_HUY":
      return { label: "Đã hủy", tone: "neutral" };
    default:
      return { label: humanizeToken(status), tone: "info" };
  }
}

export function getSlotStateMeta(
  status: string | null | undefined,
): StatusMeta {
  switch (status) {
    case "TRONG":
      return { label: "Còn trống", tone: "success" };
    case "DA_DAT":
      return { label: "Đã được đặt", tone: "warning" };
    case "KHOA":
      return { label: "Đang khóa", tone: "danger" };
    default:
      return { label: humanizeToken(status), tone: "neutral" };
  }
}

export function DoctorPageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="doctor-page-heading">
      <div className="doctor-page-heading__body">
        {eyebrow ? <div className="doctor-eyebrow">{eyebrow}</div> : null}
        <h1 className="doctor-page-heading__title">{title}</h1>
        <p className="doctor-page-heading__description">{description}</p>
      </div>
      {actions ? (
        <div className="doctor-page-heading__actions">{actions}</div>
      ) : null}
    </div>
  );
}

export function DoctorStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: Tone;
}) {
  return (
    <span className={cx("doctor-badge", `doctor-badge--${tone}`)}>{label}</span>
  );
}

export function DoctorPanel({
  title,
  description,
  aside,
  children,
  className,
}: {
  title?: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("doctor-panel", className)}>
      {title || description || aside ? (
        <div className="doctor-panel__header">
          <div>
            {title ? <h2 className="doctor-panel__title">{title}</h2> : null}
            {description ? (
              <p className="doctor-panel__description">{description}</p>
            ) : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DoctorNotice({
  tone = "neutral",
  title,
  description,
  action,
}: {
  tone?: Tone;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={cx("doctor-notice", `doctor-notice--${tone}`)}>
      <div>
        <div className="doctor-notice__title">{title}</div>
        <p className="doctor-notice__description">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function DoctorStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="doctor-stat-card">
      <span className="doctor-stat-card__label">{label}</span>
      <strong className="doctor-stat-card__value">{value}</strong>
      {hint ? <span className="doctor-stat-card__hint">{hint}</span> : null}
    </div>
  );
}

export function DoctorEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="doctor-empty-state">
      <div className="doctor-empty-state__icon">∅</div>
      <div className="doctor-empty-state__title">{title}</div>
      <p className="doctor-empty-state__description">{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function DoctorAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  const seed = encodeURIComponent(name || "doctor");
  const dicebear = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=0e9e8a,0a6e62,1a6fa0&backgroundType=gradientLinear&fontSize=38&fontWeight=600`;

  const src = imageUrl || dicebear;

  return (
    <img
      className="doctor-avatar doctor-avatar--image"
      src={src}
      alt={name}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== dicebear) target.src = dicebear;
      }}
    />
  );
}

export function AccountCard({
  id,
  username,
  role,
  fullName,
  status,
  doctorId,
  doctorStatus,
  onDetail,
  onToggleLock,
  onChangeRole,
  isLoading,
}: {
  id: number;
  username: string;
  role: string;
  fullName?: string | null;
  status: string;
  doctorId?: number | null;
  doctorStatus?: string | null;
  onDetail: () => void;
  onToggleLock: () => void;
  onChangeRole: () => void;
  isLoading: boolean;
}) {
  const getRoleBadge = () => {
    if (role === "QUAN_TRI_VIEN")
      return { label: "Admin", tone: "danger" as Tone };
    if (role === "BAC_SI") return { label: "Doctor", tone: "info" as Tone };
    return { label: "Member", tone: "success" as Tone };
  };

  const getStatusBadge = () => {
    return status === "KHOA"
      ? { label: "Locked", tone: "danger" as Tone }
      : { label: "Active", tone: "success" as Tone };
  };

  const roleMeta = getRoleBadge();
  const statusMeta = getStatusBadge();

  return (
    <div className="account-card">
      <div className="account-card__header">
        <div className="account-card__identity">
          <div className="account-card__id">#{id}</div>
          <div className="account-card__username">{username}</div>
        </div>
        <div className="account-card__badges">
          <span
            className={cx("doctor-badge", `doctor-badge--${roleMeta.tone}`)}
          >
            {roleMeta.label}
          </span>
          <span
            className={cx("doctor-badge", `doctor-badge--${statusMeta.tone}`)}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      {(fullName || doctorId) && (
        <div className="account-card__details">
          {fullName && (
            <div className="account-card__detail-item">
              <span className="account-card__label">Name</span>
              <span className="account-card__value">{fullName}</span>
            </div>
          )}
          {doctorId && (
            <div className="account-card__detail-item">
              <span className="account-card__label">Doctor ID</span>
              <span className="account-card__value">#{doctorId}</span>
              {doctorStatus && (
                <span
                  className={cx(
                    "doctor-badge",
                    `doctor-badge--${doctorStatus === "DA_DUYET" ? "success" : doctorStatus === "CHO_DUYET" ? "warning" : "danger"}`,
                  )}
                >
                  {doctorStatus === "DA_DUYET"
                    ? "Approved"
                    : doctorStatus === "CHO_DUYET"
                      ? "Pending"
                      : "Rejected"}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="account-card__footer">
        <button className="btn btn-outline" type="button" onClick={onDetail}>
          Details
        </button>
        <button
          className={status === "KHOA" ? "btn btn-primary" : "btn btn-danger"}
          type="button"
          disabled={isLoading}
          onClick={onToggleLock}
        >
          {status === "KHOA" ? "Unlock" : "Lock"}
        </button>
        <button
          className="btn"
          type="button"
          disabled={isLoading}
          onClick={onChangeRole}
        >
          Change Role
        </button>
      </div>
    </div>
  );
}
