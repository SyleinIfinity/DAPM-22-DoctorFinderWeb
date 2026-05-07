import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/http";
import type { AppointmentDetail } from "../../api/types";
import { PageHeader } from "../../components/PageHeader";
import { getApiErrorMessage } from "../../utils/errors";

export function AppointmentDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
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
  return (
    <div className="member-page-shell">
      <PageHeader title="Phiếu đặt lịch" right={<span className="member-link">{detail.trangThaiPhieu}</span>} />
      <div className="member-panel" style={{ textAlign: "center" }}>
        <div className="member-hero__title">Phiếu đã được gửi!</div>
        <p className="member-note">Bác sĩ sẽ xác nhận trong vòng 30 phút.</p>
        <p className="member-link">Mã phiếu: #{detail.maPhieuDatLich}</p>
      </div>

      <div className="member-panel">
        <div className="member-panel__title" style={{ marginBottom: 16 }}>Chi tiết lịch hẹn</div>
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
        <button className="btn btn-outline" onClick={() => navigate("/app/home")}>Trang chủ</button>
        <button className="btn btn-primary" onClick={() => navigate("/app/messages")}>Nhắn tin</button>
      </div>
    </div>
  );
}
