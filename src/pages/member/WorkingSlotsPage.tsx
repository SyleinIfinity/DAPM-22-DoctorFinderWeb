import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/http";
import type { DoctorProfile, WorkingSlot } from "../../api/types";
import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function formatDateLong(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function WorkingSlotsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const maBacSi = Number(params.maBacSi);
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(ymd(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<WorkingSlot | null>(null);

  const doctorQuery = useQuery({
    queryKey: ["doctor-profile", maBacSi, session?.maTaiKhoan],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/${maBacSi}`, {
      params: session?.maTaiKhoan ? { viewerMaTaiKhoan: session.maTaiKhoan } : {},
    })).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  });

  const scheduleQuery = useQuery({
    queryKey: ["doctor-working-slots", maBacSi, selectedDate],
    queryFn: async () => (await api.get<WorkingSlot[]>(`/api/doctors/${maBacSi}/working-slots`, { params: { date: selectedDate } })).data,
    enabled: Number.isFinite(maBacSi) && maBacSi > 0,
  });

  const calendarDays = monthGrid(monthAnchor);
  const slots = scheduleQuery.data || [];
  const selectedDaySlots = useMemo(() => slots.filter((slot) => (slot.ngayCuThe || selectedDate) === selectedDate), [slots, selectedDate]);
  const selectedDoctor = doctorQuery.data;

  return (
    <div className="member-page-shell">
      <PageHeader
        title="Đặt lịch khám"
        right={<span className="member-link">Bước 1 / 3</span>}
      />

      {doctorQuery.isError ? <div className="member-panel member-panel--error">{getApiErrorMessage(doctorQuery.error)}</div> : null}
      {scheduleQuery.isError ? <div className="member-panel member-panel--error">{getApiErrorMessage(scheduleQuery.error)}</div> : null}

      <section className="member-panel member-booking-grid">
        <div className="member-booking-calendar">
          <div className="member-panel__header">
            <div>
              <div className="member-panel__title">Lịch tháng</div>
              <div className="member-panel__subtitle">Bấm vào từng ngày để xem khung giờ khả dụng</div>
            </div>
            <div className="member-booking-calendar__nav">
              <button type="button" className="btn btn-outline" onClick={() => setMonthAnchor(addDays(monthAnchor, -30))}>Tháng trước</button>
              <button type="button" className="btn btn-outline" onClick={() => setMonthAnchor(addDays(monthAnchor, 30))}>Tháng sau</button>
            </div>
          </div>
          <div className="member-booking-calendar__month">{monthAnchor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</div>
          <div className="member-booking-calendar__grid">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => <div key={day} className="member-booking-calendar__weekday">{day}</div>)}
            {calendarDays.map((day) => {
              const dateKey = ymd(day);
              const active = dateKey === selectedDate;
              const available = dateKey >= ymd(new Date()) && dateKey <= ymd(addDays(new Date(), 60));
              return (
                <button
                  key={dateKey}
                  type="button"
                  className={active ? "member-booking-calendar__day is-active" : "member-booking-calendar__day"}
                  onClick={() => setSelectedDate(dateKey)}
                >
                  <span>{day.getDate()}</span>
                  <small>{available ? (active ? "Đang chọn" : "Trống") : "Hết hạn"}</small>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="member-booking-detail">
          <div className="member-panel__header">
            <div>
              <div className="member-panel__title">Chi tiết lịch khả dụng</div>
              <div className="member-panel__subtitle">{formatDateLong(selectedDate)}</div>
            </div>
          </div>

          <div className="member-booking-doctor-card">
            <div className="member-booking-doctor-card__avatar">{selectedDoctor?.hoTenDayDu?.slice(0, 2).toUpperCase() || "BS"}</div>
            <div>
              <strong>{selectedDoctor?.hoTenDayDu || "Bác sĩ"}</strong>
              <p>{selectedDoctor?.chuyenKhoa || "Chưa có thông tin chuyên khoa"}</p>
            </div>
          </div>

          {scheduleQuery.isLoading ? <div className="member-empty-state">Đang tải lịch khả dụng...</div> : null}
          {!scheduleQuery.isLoading && selectedDaySlots.length === 0 ? <div className="member-empty-state">Ngày này chưa có khung giờ khả dụng.</div> : null}

          <div className="member-slot-list">
            {selectedDaySlots.map((slot) => (
              <button
                key={slot.maChiTiet}
                type="button"
                className={selectedSlot?.maChiTiet === slot.maChiTiet ? "member-slot-card is-active" : "member-slot-card"}
                onClick={() => setSelectedSlot(slot)}
              >
                <strong>{slot.gioBatDau.slice(0, 5)} - {slot.gioKetThuc.slice(0, 5)}</strong>
                <span>{slot.trangThaiLich}</span>
                <small>{slot.trangThai === "TRONG" ? "Còn chỗ" : "Đã có người chọn"}</small>
              </button>
            ))}
          </div>

          <div className="member-slot-summary">
            <div><span>Ngày</span><strong>{formatDateLong(selectedDate)}</strong></div>
            <div><span>Khung giờ</span><strong>{selectedSlot ? selectedSlot.gioBatDau.slice(0, 5) : "--:--"}</strong></div>
          </div>
        </aside>
      </section>

      <div className="member-sticky-actions">
        <button onClick={() => navigate(-1)} className="btn btn-outline">Hủy</button>
        <button
          disabled={!selectedSlot}
          onClick={() => navigate("/app/appointments/new", { state: { doctor: selectedDoctor, selected: selectedSlot, date: selectedDate } })}
          className="btn btn-primary"
          type="button"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
