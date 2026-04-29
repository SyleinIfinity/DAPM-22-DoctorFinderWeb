import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const specialties = [
    { id: 1, name: 'Tim mạch', icon: '🩺', color: '#FFF0F3', iconColor: '#E91E63' },
    { id: 2, name: 'Thần kinh', icon: '🧠', color: '#FFF9E5', iconColor: '#FFA000' },
    { id: 3, name: 'Nha khoa', icon: '🦷', color: '#E5FBF9', iconColor: '#009688' },
    { id: 4, name: 'Nhi khoa', icon: '🍼', color: '#E5F5FB', iconColor: '#03A9F4' },
  ];

  const doctors = [
    { id: 1, name: 'BS. Lê Bình', specialty: 'Nhi khoa' },
    { id: 2, name: 'BS. Lê Bình', specialty: 'Nhi khoa' },
    { id: 3, name: 'BS. Lê Bình', specialty: 'Nhi khoa' },
  ];

  // Thu hồi bộ nhớ khi ảnh thay đổi
  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  return (
    <div className="home-light-wrapper" style={{ backgroundColor: '#F4F7F8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="home-light container" style={{ maxWidth: '600px' }}>

        {/* 1. HEADER */}
        <div className="row-between" style={{ marginBottom: 25, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A' }}>
              👋 Xin chào, Huy
            </div>
            <div className="muted">Chăm sóc sức khoẻ mỗi ngày</div>
          </div>

          <div style={{ position: 'relative', fontSize: '24px', cursor: 'pointer' }}>
            🔔
            <span style={{
              position: 'absolute', top: 0, right: 0, width: 9, height: 9,
              background: '#FF4D4F', borderRadius: '50%', border: '2px solid #fff'
            }} />
          </div>
        </div>

        {/* 2. SEARCH + IMAGE UPLOAD */}
        <div className="row" style={{ marginBottom: 8, gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#AAA' }}>🔍</span>
            <input
              className="input"
              style={{ paddingLeft: '45px', borderRadius: '20px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', height: '50px' }}
              placeholder="Tìm bác sĩ, bệnh, triệu chứng..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          {/* Nút Tìm kiếm (Mới bổ sung) */}
          <button 
            onClick={() => console.log('Searching:', searchValue)}
            className="btn btn-primary"
            style={{ 
              borderRadius: '15px', 
              height: '50px', 
              padding: '0 20px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Tìm
          </button>

          <label className="btn btn-primary" style={{ cursor: 'pointer', width: '50px', height: '50px', borderRadius: '15px', display: 'grid', placeItems: 'center', padding: 0 }}>
            📷
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImage(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>

        {/* Preview ảnh khi chọn */}
        {image && (
          <div style={{ marginBottom: 15, position: 'relative', width: 'fit-content' }}>
            <img src={image} alt="preview" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid #24D5DB' }} />
            <button 
              onClick={() => setImage(null)}
              style={{ position: 'absolute', top: -5, right: -5, background: '#FF4D4F', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontWeight: 'bold' }}
            >
              ×
            </button>
          </div>
        )}

        <div className="muted" style={{ marginBottom: 25, fontSize: '13px' }}>
          🔍 Gợi ý: đau đầu → <b style={{ color: '#009688', cursor: 'pointer' }}>bác sĩ thần kinh</b>
        </div>

        {/* 3. ĐIỀU HƯỚNG NHANH (BỔ SUNG) */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: 30 }}>
          <button 
            onClick={() => navigate('/app/doctors/recent')}
            className="card"
            style={{ flex: 1, padding: '12px', border: 'none', fontWeight: '700', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            🕒 Bác sĩ vừa xem
          </button>
          <button 
            onClick={() => navigate('/app/doctors/suggested')}
            className="card"
            style={{ flex: 1, padding: '12px', border: 'none', fontWeight: '700', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            ✨ Bác sĩ gợi ý
          </button>
        </div>

        {/* 4. CHUYÊN KHOA */}
        <div className="row-between" style={{ marginBottom: 15 }}>
          <div className="title" style={{ fontSize: '18px' }}>Chuyên khoa</div>
          <div style={{ color: '#009688', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            Xem tất cả
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {specialties.map(s => (
            <div key={s.id} style={{ textAlign: 'center', cursor: 'pointer' }}>
              <div style={{
                background: s.color, borderRadius: 18, height: 70, 
                display: 'grid', placeItems: 'center', fontSize: 28,
                transition: 'transform 0.2s'
              }}>
                <span style={{ color: s.iconColor }}>{s.icon}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: '13px', fontWeight: '600', color: '#444' }}>{s.name}</div>
            </div>
          ))}
        </div>

        {/* 5. PROMO BANNER (SMART SEARCH) */}
        <div style={{
          marginTop: 30, padding: '20px', borderRadius: '22px',
          background: 'linear-gradient(135deg, #24D5DB, #00A8A8)',
          color: '#fff', display: 'flex', alignItems: 'center', gap: '15px',
          boxShadow: '0 8px 25px rgba(36, 213, 219, 0.3)'
        }}>
          <div style={{ fontSize: '32px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '50%', width: 55, height: 55, display: 'grid', placeItems: 'center' }}>💡</div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: '16px' }}>Gợi ý cho bạn</b>
            <div style={{ margin: '5px 0 12px', fontSize: '13px', opacity: 0.9 }}>
              Bạn hay tìm "đau đầu" → khám ngay danh sách các bác sĩ thần kinh hàng đầu.
            </div>
            <button style={{ background: '#fff', color: '#24D5DB', border: 'none', padding: '8px 18px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>
              XEM NGAY
            </button>
          </div>
        </div>

        {/* 6. BÁC SĨ GẦN ĐÂY */}
        <div className="title" style={{ marginTop: 30, marginBottom: 15, fontSize: '18px' }}>
          Bác sĩ tìm kiếm gần đây
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 15 }}>
          {doctors.map(d => (
            <div key={d.id} className="card" style={{ textAlign: 'center', border: 'none', borderRadius: '22px', padding: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <img
                src="https://via.placeholder.com/150"
                style={{ width: '100%', aspectRatio: '1/1', borderRadius: '15px', objectFit: 'cover', marginBottom: 10 }}
              />
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#333' }}>
                {d.name}
              </div>
              <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>{d.specialty}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}