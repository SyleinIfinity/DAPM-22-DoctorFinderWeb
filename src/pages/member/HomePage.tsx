import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { loadRecentDoctors } from '../../utils/recentDoctors';
import type { RecentDoctor } from '../../utils/recentDoctors';

export default function HomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentDoctors, setRecentDoctors] = useState<RecentDoctor[]>([]);

  // Load recent doctors from localStorage
  useEffect(() => {
    const doctors = loadRecentDoctors();
    // Tăng slice lên nếu bạn muốn hiển thị nhiều thẻ nằm ngang hơn để cuộn
    setRecentDoctors(doctors.slice(0, 5)); 
  }, []);

  // Get user display name
  const userName = session?.tenDangNhap || 'bạn';

  const specialties = [
    { id: 1, name: 'Tim mạch', icon: '🩺', color: '#FFF0F3', iconColor: '#E91E63' },
    { id: 2, name: 'Thần kinh', icon: '🧠', color: '#FFF9E5', iconColor: '#FFA000' },
    { id: 3, name: 'Nha khoa', icon: '🦷', color: '#E5FBF9', iconColor: '#009688' },
    { id: 4, name: 'Nhi khoa', icon: '🍼', color: '#E5F5FB', iconColor: '#03A9F4' },
  ];

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const openSearch = () => setSearchOpen(true);

  return (
    <div className="member-page-shell member-home-shell">
      <div className="member-hero">
        <div>
          <div className="member-hero__title">Xin chào, {userName}</div>
          <div className="member-hero__subtitle">Chăm sóc sức khoẻ mỗi ngày</div>
        </div>
        <button type="button" className="member-notification-btn">🔔</button>
      </div>

      <section className="member-search-bar">
        <div className="member-search-bar__input-wrap" onClick={openSearch} role="button" tabIndex={0}>
          <span>🔍</span>
          <input
            className="member-input member-input--search"
            placeholder="Tìm bác sĩ, bệnh, triệu chứng..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={openSearch}
          />
        </div>
        <button onClick={openSearch} className="btn btn-primary" type="button">Tìm</button>
        <label className="btn btn-outline member-camera-btn">
          📷
          <input type="file" accept="image/*" hidden onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setImage(URL.createObjectURL(file));
          }} />
        </label>
      </section>

      {searchOpen ? (
        <div className="member-search-overlay">
          <div className="member-panel member-search-overlay__panel">
            <div className="member-panel__header">
              <div>
                <div className="member-panel__title">Vùng tùy chọn tìm kiếm</div>
                <div className="member-panel__subtitle">Nhập từ khoá hoặc chọn chuyên khoa</div>
              </div>
              <button className="member-icon-btn" type="button" onClick={() => setSearchOpen(false)}>×</button>
            </div>
            <input className="member-input" placeholder="Nhập tên bác sĩ / triệu chứng / cơ sở" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
            <div className="member-search-overlay__chips">
              {specialties.map((item) => (
                <button key={item.id} type="button" className="member-chip" onClick={() => { setSearchValue(item.name); navigate('/app/search', { state: { keyword: item.name } }); }}>
                  {item.name}
                </button>
              ))}
            </div>
            <div className="member-search-overlay__actions">
              <button className="btn btn-outline" type="button" onClick={() => setSearchValue('')}>Xoá</button>
              <button className="btn btn-primary" type="button" onClick={() => navigate('/app/search', { state: { keyword: searchValue } })}>Xem kết quả</button>
            </div>
          </div>
        </div>
      ) : null}

      {image ? (
        <div className="member-preview">
          <img src={image} alt="preview" />
          <button onClick={() => setImage(null)} className="member-preview__close" type="button">×</button>
        </div>
      ) : null}

      <div className="member-note">Gợi ý: đau đầu → bác sĩ thần kinh</div>

      <div className="member-quick-actions">
        <button onClick={() => navigate('/app/doctors/recent')} className="member-action-card" type="button">🕒 Bác sĩ vừa xem</button>
        <button onClick={() => navigate('/app/doctors/suggested')} className="member-action-card" type="button">✨ Bác sĩ gợi ý</button>
      </div>

      <section className="member-panel">
        <div className="member-panel__header">
          <div>
            <div className="member-panel__title">Chuyên khoa</div>
            <div className="member-panel__subtitle">Chọn chuyên khoa phổ biến</div>
          </div>
          <button className="member-link" type="button" onClick={() => navigate('/app/search')}>Tìm kiếm</button>
        </div>
        <div className="member-specialty-grid">
          {specialties.map((s) => (
            <button key={s.id} className="member-specialty-card" type="button" onClick={() => navigate('/app/search', { state: { keyword: s.name } })}>
              <div style={{ background: s.color, color: s.iconColor }} className="member-specialty-card__icon">{s.icon}</div>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* CẬP NHẬT PHẦN BÁC SĨ TÌM KIẾM GẦN ĐÂY */}
      <section className="member-panel">
        <div className="member-panel__header">
          <div>
            <div className="member-panel__title">Bác sĩ tìm kiếm gần đây</div>
            <div className="member-panel__subtitle">Các hồ sơ bạn đã xem</div>
          </div>
        </div>
        
        {recentDoctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF', fontSize: '14px' }}>
            Bạn chưa xem hồ sơ bác sĩ nào gần đây
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {recentDoctors.map((d: any) => {
              const name = d.hoTenDayDu || d.hoTenBacSi || "Bác sĩ";
              const initials = name.replace("BS. ", "").charAt(0).toUpperCase();
              
              // Lấy ảnh (ưu tiên các trường hợp tên biến từ API nếu có trong LocalStorage)
              const avatarUrl = d.anhDaiDien || d.anhDaiDienBacSi || d.bacSi?.anhDaiDien || null;

              return (
                <button 
                  key={d.maBacSi} 
                  type="button" 
                  onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '16px',
                    minWidth: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s',
                    flexShrink: 0 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2dd4bf';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(20, 184, 166, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                  }}
                >
                  {/* Avatar vuông bo góc */}
                  <div 
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f0fdfa', // Teal nhạt
                      color: '#0f766e', // Teal đậm
                      fontWeight: 'bold',
                      fontSize: '24px',
                      overflow: 'hidden',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  
                  {/* Thông tin */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#111827', margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {name}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {d.chuyenKhoa || "Chuyên khoa"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}