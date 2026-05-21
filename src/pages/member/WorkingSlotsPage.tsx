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
  
  const todayStr = ymd(new Date());
  
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<WorkingSlot | null>(null);
  const [fullDates, setFullDates] = useState<Set<string>>(new Set());

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

  const relatedDoctorsQuery = useQuery({
    queryKey: ["all-doctors"],
    queryFn: async () => {
        return (await api.get<DoctorProfile[]>(`/api/doctors`)).data;
    },
  });

  const calendarDays = monthGrid(monthAnchor);
  const slots = scheduleQuery.data || [];
  const selectedDaySlots = useMemo(() => slots.filter((slot) => (slot.ngayCuThe || selectedDate) === selectedDate), [slots, selectedDate]);
  const selectedDoctor = doctorQuery.data;
  
  useMemo(() => {
    if (slots.length > 0) {
      if (selectedDate === todayStr) {
        const now = new Date();
        const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const futureSlots = selectedDaySlots.filter(slot => slot.gioBatDau >= currentHourStr);
        const isFull = futureSlots.length > 0 ? futureSlots.every(s => s.trangThai !== "TRONG") : true;
        if (isFull) {
          setFullDates(prev => new Set([...prev, selectedDate]));
        }
      } else {
        const isFull = selectedDaySlots.length > 0 && selectedDaySlots.every(s => s.trangThai !== "TRONG");
        if (isFull) {
          setFullDates(prev => new Set([...prev, selectedDate]));
        }
      }
    }
  }, [slots, selectedDate, selectedDaySlots, todayStr]);

  const getSlotStyle = (slot: WorkingSlot, isSelected: boolean) => {
      const isBooked = slot.trangThai !== "TRONG";
      const isPastDate = selectedDate < todayStr;
      const now = new Date();
      const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const isPastTime = selectedDate === todayStr && slot.gioBatDau < currentHourStr;
      const isPast = isPastDate || isPastTime;

      if (isPast) {
          return {
              className: "member-slot-card member-slot-card--past",
              statusText: "Đã qua",
              statusTone: "past",
              isDisabled: true,
          };
      }

      if (isBooked) {
          return {
              className: "member-slot-card member-slot-card--full",
              statusText: "Hết chỗ",
              statusTone: "full",
              isDisabled: true,
          };
      }

      if (isSelected) {
          return {
              className: "member-slot-card member-slot-card--active",
              statusText: "Đang chọn",
              statusTone: "active",
              isDisabled: false,
          };
      }

      return {
          className: "member-slot-card member-slot-card--available",
          statusText: "Còn chỗ",
          statusTone: "available",
          isDisabled: false,
      };
  };

  return (
    <div className="member-page-shell">
      <PageHeader
        title="Chọn ngày & giờ khám"
        right={<span className="member-link">Bước 1 / 3</span>}
      />

      {doctorQuery.isError ? <div className="member-panel member-panel--error">{getApiErrorMessage(doctorQuery.error)}</div> : null}
      {scheduleQuery.isError ? <div className="member-panel member-panel--error">{getApiErrorMessage(scheduleQuery.error)}</div> : null}

      <section className="member-booking-grid" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        <div style={{ flex: '5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="member-panel" style={{ padding: '16px', overflow: 'hidden' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>
                    🏢 Bác sĩ chuyên khoa {selectedDoctor?.chuyenKhoa || "đang tải..."}
                </div>
                
                <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '8px' }}>
                    
                    {selectedDoctor && (
                        <div 
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '2px solid #3b82f6', backgroundColor: '#eff6ff', minWidth: 'fit-content', cursor: 'default' }}
                        >
                            <span style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                                {selectedDoctor.trinhDoChuyenMon}
                            </span>
                            <strong style={{ display: 'block', fontSize: '14px', color: '#1d4ed8' }}>{selectedDoctor.hoTenDayDu}</strong>
                            <span style={{ fontSize: '12px', color: '#3b82f6' }}>• Đang chọn lịch</span>
                        </div>
                    )}

                    {relatedDoctorsQuery.data?.filter(d => d.maBacSi !== maBacSi).map((doc) => (
                        <div 
                            key={doc.maBacSi}
                            onClick={() => navigate(`/app/doctors/${doc.maBacSi}/slots`)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', minWidth: 'fit-content', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                        >
                            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                                {doc.trinhDoChuyenMon}
                            </span>
                            <strong style={{ display: 'block', fontSize: '14px', color: '#4b5563' }}>{doc.hoTenDayDu}</strong>
                        </div>
                    ))}
                    
                    {relatedDoctorsQuery.isLoading && <div style={{ padding: '10px', fontSize: '13px', color: '#9ca3af' }}>Đang tìm bác sĩ...</div>}
                </div>
            </div>

            <div className="member-booking-calendar member-panel">
            <div className="member-panel__header">
                <div>
                <div className="member-panel__title">Lịch làm việc</div>
                <div className="member-panel__subtitle">Bấm vào ngày để xem khung giờ</div>
                </div>
                <div className="member-booking-calendar__nav">
                <button type="button" className="btn btn-outline" onClick={() => setMonthAnchor(addDays(monthAnchor, -30))}>&lt;</button>
                <div style={{fontWeight: 'bold', margin: '0 10px'}}>{monthAnchor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</div>
                <button type="button" className="btn btn-outline" onClick={() => setMonthAnchor(addDays(monthAnchor, 30))}>&gt;</button>
                </div>
            </div>
            
            <div className="member-booking-calendar__grid">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => <div key={day} className="member-booking-calendar__weekday">{day}</div>)}
                {calendarDays.map((day) => {
                const dateKey = ymd(day);
                const isPastDate = dateKey < todayStr; 
                const active = dateKey === selectedDate;
                const available = dateKey >= todayStr && dateKey <= ymd(addDays(new Date(), 60));
                const isFull = fullDates.has(dateKey);
                
                return (
                    <button
                    key={dateKey}
                    type="button"
                    className={`member-booking-calendar__day${active ? ' is-active' : ''}${isPastDate ? ' is-disabled' : ''}${isFull ? ' is-full' : ''}`}
                    disabled={isPastDate || !available}
                    onClick={() => {
                        setSelectedDate(dateKey);
                        setSelectedSlot(null); 
                    }}
                    >
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{day.getDate()}</span>
                    <small style={{ fontSize: '10px' }}>
                        {isPastDate ? "Đã qua" : available ? (active ? (isFull ? "Hết chỗ" : "Đang xem") : "Chọn") : "Chưa mở"}
                    </small>
                    </button>
                );
                })}
            </div>
            </div>
        </div>

        <aside className="member-booking-detail member-panel" style={{ flex: '4', position: 'sticky', top: '20px' }}>
          
          <div className="member-booking-doctor-card" style={{ display: 'flex', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <div className="member-booking-doctor-card__avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#4f46e5', overflow: 'hidden' }}>
                {selectedDoctor?.anhDaiDien ? (
                    <img src={selectedDoctor.anhDaiDien} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                ) : (
                    selectedDoctor?.hoTenDayDu?.slice(0, 2).toUpperCase() || "BS"
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '2px' }}>
                  {selectedDoctor?.trinhDoChuyenMon || "Bác sĩ"}
              </span>
              <strong style={{ fontSize: '18px', color: '#111827', lineHeight: '1.2' }}>
                  {selectedDoctor?.hoTenDayDu || "Đang tải..."}
              </strong>
              <p style={{ color: '#3b82f6', margin: 0, fontSize: '14px', marginTop: '4px' }}>
                  Khoa: {selectedDoctor?.chuyenKhoa || "Chuyên khoa"}
              </p>
            </div>
          </div>

          <div className="member-panel__header" style={{ paddingBottom: '10px' }}>
            <div>
              <div className="member-panel__title">Khung giờ: {formatDateLong(selectedDate)}</div>
            </div>
          </div>

          <div className="member-slot-legend">
            <span className="member-slot-legend__item">
              <i className="member-slot-legend__dot member-slot-legend__dot--available" />
              Còn chỗ
            </span>
            <span className="member-slot-legend__item">
              <i className="member-slot-legend__dot member-slot-legend__dot--full" />
              Hết chỗ
            </span>
            <span className="member-slot-legend__item">
              <i className="member-slot-legend__dot member-slot-legend__dot--past" />
              Đã qua
            </span>
          </div>

          {scheduleQuery.isLoading ? <div className="member-empty-state">Đang tải lịch khả dụng...</div> : null}
          {!scheduleQuery.isLoading && selectedDaySlots.length === 0 ? <div className="member-empty-state">Ngày này chưa có khung giờ khả dụng hoặc bác sĩ nghỉ.</div> : null}

          <div className="member-slot-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
            {selectedDaySlots.map((slot) => {
              const isSelected = selectedSlot?.maChiTiet === slot.maChiTiet;
              const slotProps = getSlotStyle(slot, isSelected);

              return (
                  <button
                    key={slot.maChiTiet}
                    type="button"
                    className={slotProps.className}
                    disabled={slotProps.isDisabled}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                        padding: '12px 8px',
                        borderRadius: '8px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                  >
                    <strong style={{ fontSize: '15px' }}>{slot.gioBatDau.slice(0, 5)} - {slot.gioKetThuc.slice(0, 5)}</strong>
                    <span className={`member-slot-status member-slot-status--${slotProps.statusTone}`}>
                        {slotProps.statusText}
                    </span>
                  </button>
              );
            })}
          </div>

          <div className="member-slot-summary" style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Ngày chọn:</span>
                <strong style={{ color: '#111827' }}>{formatDateLong(selectedDate)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Giờ khám:</span>
                <strong style={{ color: '#111827' }}>{selectedSlot ? `${selectedSlot.gioBatDau.slice(0, 5)} - ${selectedSlot.gioKetThuc.slice(0, 5)}` : "Chưa chọn"}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ flex: '1' }}>Quay lại</button>
            <button
              disabled={!selectedSlot}
              onClick={() => navigate("/app/appointments/new", { state: { doctor: selectedDoctor, selected: selectedSlot, date: selectedDate } })}
              className="btn btn-primary"
              style={{ flex: '2', opacity: selectedSlot ? 1 : 0.5 }}
              type="button"
            >
              Tiếp tục Đặt khám
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
