import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/http';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../auth/AuthContext';
import type { AppointmentDetail, DoctorProfile } from '../../api/types';
import { getApiErrorMessage } from '../../utils/errors';

export function CreateAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { selected, date, doctor } = location.state || {};

  const [hoTen, setHoTen] = useState('');
  const [trieuChung, setTrieuChung] = useState('Khám lần đầu');
  const [timeLeft, setTimeLeft] = useState(587);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDoctor = doctor as DoctorProfile | undefined;
  const selectedSlot = selected as any;
  const displayName = useMemo(() => session?.tenDangNhap || 'Bệnh nhân', [session?.tenDangNhap]);

  useEffect(() => {
    setHoTen(displayName);
  }, [displayName]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!session?.maNguoiDung) throw new Error('Thiếu mã người dùng');
      if (!selectedSlot?.maChiTiet) throw new Error('Chưa chọn khung giờ');
      const payload = {
        maNguoiDung: session.maNguoiDung,
        maChiTiet: selectedSlot.maChiTiet,
        loaiPhieu: 'DAT_MOI',
        trieuChungGhiChu: trieuChung.trim() || null,
      };
      return (await api.post<AppointmentDetail>('/api/appointments', payload)).data;
    },
    onSuccess: (data) => navigate(`/app/appointments/${data.maPhieuDatLich}`),
  });

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="member-page-shell">
      <PageHeader title="Thông tin đặt lịch" right={<span className="member-link">Bước 2 / 3</span>} />

      <div className="member-panel" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="member-summary-card">
          <div>
            <div className="member-label">Lịch đã chọn</div>
            <div className="member-strong">{date || '—'} · {selectedSlot?.gioBatDau?.slice?.(0, 5) || '--:--'}</div>
            <div className="member-subtle">{currentDoctor?.tenCoSoYTe || 'Phòng khám'} · {currentDoctor?.hoTenDayDu || 'Bác sĩ'}</div>
          </div>
          <button onClick={() => navigate(-1)} className="member-icon-btn" type="button">✎</button>
        </div>

        <div className="member-alert">Slot sẽ được giữ trong <strong>{formatTime(timeLeft)}</strong></div>

        <div className="member-form-card">
          <div className="member-panel__title">Thông tin bệnh nhân</div>
          <input className="member-input" value={hoTen} onChange={e => setHoTen(e.target.value)} />
          <div className="member-subtle">Sẽ gửi theo tài khoản: {session?.tenDangNhap || '—'}</div>
        </div>

        <div className="member-form-card">
          <div className="member-panel__title">Triệu chứng & ghi chú</div>
          <textarea className="member-input" rows={5} value={trieuChung} onChange={e => setTrieuChung(e.target.value)} />
        </div>

        {mutation.isError ? <div className="member-empty-state member-empty-state--error">{getApiErrorMessage(mutation.error)}</div> : null}
      </div>

      <div className="member-sticky-actions">
        <button onClick={() => navigate(-1)} className="btn btn-outline" type="button">Quay lại</button>
        <button onClick={() => mutation.mutate()} className="btn btn-primary" type="button" disabled={mutation.isPending}>Gửi phiếu</button>
      </div>
    </div>
  );
}
