import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';

export function CreateAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selected, date } = location.state || {}; // Nhận dữ liệu từ Bước 1

  const [hoTen, setHoTen] = useState('Trần Văn An');
  const [trieuChung, setTrieuChung] = useState('Khám lần đầu');
  const [timeLeft, setTimeLeft] = useState(587);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ backgroundColor: '#F4F7F8', minHeight: '100vh', paddingBottom: '100px' }}>
      <PageHeader title="Thông tin đặt lịch" right={<span style={{ fontSize: '12px', color: '#0d9488' }}>Bước 2 / 3</span>} />

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '15px' }}>
        {/* SUMMARY CARD */}
        <div className="card" style={{ padding: '15px', borderRadius: '15px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#999', fontSize: '12px' }}>Lịch đã chọn</div>
            <div style={{ fontWeight: 'bold' }}>T3, {date} · {selected?.gioBatDau}</div>
            <div style={{ color: '#0d9488', fontSize: '13px' }}>Tại phòng khám · BV Bạch Mai</div>
          </div>
          <button onClick={() => navigate(-1)} style={{ border: 'none', background: '#e6fffa', color: '#0d9488', borderRadius: '8px', width: '30px', height: '30px' }}>✎</button>
        </div>

        {/* TIMER */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ color: '#b45309', fontSize: '13px' }}>● Slot sẽ được giữ trong</div>
          <div style={{ fontWeight: 'bold', color: '#d97706' }}>{formatTime(timeLeft)}</div>
        </div>

        {/* PATIENT FORM */}
        <div className="card" style={{ padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>👤 Thông tin bệnh nhân</div>
          <input 
            style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: '10px 0', marginBottom: '20px', outline: 'none' }} 
            value={hoTen} onChange={e => setHoTen(e.target.value)} 
          />
          <button style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e6fffa', color: '#0d9488', background: '#fff', fontWeight: 'bold' }}>+ Thêm người thân</button>
        </div>

        {/* NOTES */}
        <div className="card" style={{ padding: '20px', borderRadius: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>📗 Triệu chứng & ghi chú</div>
          <textarea 
            style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', outline: 'none', resize: 'none' }} 
            value={trieuChung} onChange={e => setTrieuChung(e.target.value)}
          />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '15px 20px 30px', backgroundColor: '#fff', display: 'flex', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ flex: 1, padding: '14px', borderRadius: '25px', border: '1px solid #eee', background: '#fff' }}>Quay lại</button>
        <button 
          onClick={() => navigate(`/app/appointments/101`)} // Chuyển sang Bước 3 (Trang chi tiết phiếu)
          style={{ flex: 2, padding: '14px', borderRadius: '25px', border: 'none', backgroundColor: '#0d9488', color: '#fff', fontWeight: 'bold' }}
        >
          Gửi phiếu
        </button>
      </div>
    </div>
  );
}