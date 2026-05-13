import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/http";
import type { AppointmentDetail } from "../../api/types";
import { PageHeader } from "../../components/PageHeader";
import { getApiErrorMessage } from "../../utils/errors";
import { useAuth } from "../../auth/AuthContext";

function getAppointmentTone(status: string) {
  switch (status) {
    case "DA_KHAM":
      return { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534", label: "Đã khám" };
    case "DA_XAC_NHAN":
      return { bg: "#ecfeff", border: "#a5f3fc", color: "#155e75", label: "Đã xác nhận" };
    case "CHO_XAC_NHAN":
      return { bg: "#fffbeb", border: "#fde68a", color: "#92400e", label: "Chờ xác nhận" };
    case "TU_CHOI":
      return { bg: "#fff1f2", border: "#fecdd3", color: "#9f1239", label: "Đã từ chối" };
    case "DA_HUY":
      return { bg: "#f3f4f6", border: "#d1d5db", color: "#374151", label: "Đã hủy" };
    default:
      return { bg: "#f8fafc", border: "#e2e8f0", color: "#334155", label: status };
  }
}

export function AppointmentDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { session } = useAuth();
  const maPhieuDatLich = Number(params.maPhieuDatLich);

  const query = useQuery({
    queryKey: ["appointment-detail", maPhieuDatLich],
    queryFn: async () => (await api.get<AppointmentDetail>(`/api/appointments/${maPhieuDatLich}`)).data,
    enabled: Number.isFinite(maPhieuDatLich) && maPhieuDatLich > 0,
  });

  if (query.isLoading) {
    return <div className="member-page-shell"><PageHeader title="Phiếu đặt lịch" /><div className="member-panel">Đang tải chi tiết lịch hẹn...</div></div>;
  }

  if (query.isError || !query.data) {
    return <div className="member-page-shell"><PageHeader title="Phiếu đặt lịch" /><div className="member-panel member-panel--error">{getApiErrorMessage(query.error)}</div></div>;
  }

  const detail = query.data;
  const canReview = detail.coTheDanhGia && session?.maNguoiDung === detail.maNguoiDung;
  const tone = getAppointmentTone(detail.trangThaiPhieu);

  return (
    <div className="member-page-shell">
      <PageHeader title="Phiếu đặt lịch" right={<span className="member-status-pill" style={{ color: tone.color, backgroundColor: tone.bg, borderColor: tone.border }}>{tone.label}</span>} />

      <div className="member-panel" style={{ display: "grid", gap: 16 }}>
        <div className="member-hero" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="member-hero__title" style={{ fontSize: 24 }}>Chi tiết phiếu đặt lịch</div>
            <p className="member-note" style={{ marginTop: 6 }}>
              {detail.trangThaiPhieu === "DA_KHAM"
                ? "Lịch hẹn đã hoàn tất. Bạn có thể đánh giá bác sĩ ngay."
                : "Theo dõi trạng thái lịch hẹn và trao đổi với bác sĩ khi cần."}
            </p>
          </div>
          <div className="member-chip member-chip--soft">Mã phiếu #{detail.maPhieuDatLich}</div>
        </div>

        {canReview ? (
          <div className="member-alert" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <div>
              <strong className="member-strong">Bạn đã có thể đánh giá bác sĩ</strong>
              <div className="member-subtle">Lịch khám này đã hoàn thành. Hãy chia sẻ trải nghiệm của bạn.</div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(`/app/doctors/${detail.maBacSi}`)} type="button">
              Đánh giá bác sĩ
            </button>
          </div>
        ) : null}
      </div>

      <div className="member-panel">
        <div className="member-panel__header">
          <div>
            <div className="member-panel__title">Thông tin lịch hẹn</div>
            <div className="member-panel__subtitle">Xem toàn bộ thông tin bác sĩ, thời gian và nội dung phiếu.</div>
          </div>
        </div>

        <div className="member-doctor-list">
          <div className="member-summary-card"><strong>Bác sĩ</strong><span>{detail.hoTenBacSi}</span></div>
          <div className="member-summary-card"><strong>Chuyên khoa</strong><span>{detail.chuyenKhoa}</span></div>
          <div className="member-summary-card"><strong>Thời gian</strong><span>{detail.ngayCuThe || "—"}</span></div>
          <div className="member-summary-card"><strong>Khung giờ</strong><span>{detail.gioBatDau.slice(0, 5)} — {detail.gioKetThuc.slice(0, 5)}</span></div>
          <div className="member-summary-card"><strong>Địa điểm</strong><span>{detail.tenCoSoYTe}</span></div>
          <div className="member-summary-card"><strong>Địa chỉ</strong><span>{detail.diaChiLamViec || "—"}</span></div>
          <div className="member-summary-card"><strong>Lý do khám</strong><span>{detail.loaiPhieu}</span></div>
          <div className="member-summary-card"><strong>Ghi chú</strong><span>{detail.trieuChungGhiChu || "—"}</span></div>
        </div>
      </div>

      <div className="member-sticky-actions">
        <button className="btn btn-outline" onClick={() => navigate("/app/home")} type="button">Trang chủ</button>
        <button className="btn btn-primary" onClick={() => navigate("/app/messages")} type="button">Nhắn tin</button>
      </div>
    </div>
  );
}
