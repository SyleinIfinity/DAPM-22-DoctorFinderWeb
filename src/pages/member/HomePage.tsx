import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

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
          <div className="member-hero__title">Xin chào, Huy</div>
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
            <button key={s.id} className="member-specialty-card" type="button" onClick={() => navigate('/app/search', { state: { specialty: s.name } })}>
              <div style={{ background: s.color, color: s.iconColor }} className="member-specialty-card__icon">{s.icon}</div>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="member-panel">
        <div className="member-panel__header">
          <div>
            <div className="member-panel__title">Bác sĩ tìm kiếm gần đây</div>
            <div className="member-panel__subtitle">Các hồ sơ bạn đã xem</div>
          </div>
        </div>
        <div className="member-doctor-preview-grid">
          {doctors.map((d) => (
            <button key={d.id} className="member-doctor-preview-card" type="button" onClick={() => navigate('/app/search')}>
              <div className="member-doctor-preview-card__photo">{d.name.slice(0, 2).toUpperCase()}</div>
              <strong>{d.name}</strong>
              <span>{d.specialty}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
