import { useState } from 'react';

const HomePage = () => {
  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text');

  const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    header: { marginBottom: '30px' },
    tabWrapper: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tab: (active: boolean) => ({
      padding: '10px 25px',
      borderRadius: '50px',
      cursor: 'pointer',
      fontWeight: 'bold',
      backgroundColor: active ? '#24D5DB' : '#f0f0f0',
      color: active ? '#fff' : '#666',
      border: 'none',
      transition: '0.3s'
    }),
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: '15px 25px',
      borderRadius: '15px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      border: '2px solid #f0f0f0'
    },
    input: { flex: 1, border: 'none', outline: 'none', fontSize: '16px', marginLeft: '10px' },
    doctorGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '30px' },
    docCard: { backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #eee' },
    docInfo: { padding: '15px' },
    btnView: { width: '100%', padding: '10px', backgroundColor: '#24D5DB', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={{ color: '#333' }}>Chào buổi chiều, <span style={{ color: '#24D5DB' }}>Nhân!</span></h2>
        <p style={{ color: '#777' }}>Hôm nay bạn cần tìm bác sĩ chuyên khoa nào?</p>
      </header>

      {/* Tab chuyển mode tìm kiếm */}
      <div style={styles.tabWrapper}>
        <button style={styles.tab(searchMode === 'text')} onClick={() => setSearchMode('text')}>🔍 Tìm văn bản</button>
        <button style={styles.tab(searchMode === 'image')} onClick={() => setSearchMode('image')}>📷 Tìm bằng hình ảnh</button>
      </div>

      {/* Ô tìm kiếm linh hoạt */}
      <div style={styles.searchBox}>
        {searchMode === 'text' ? (
          <>
            <span>🔎</span>
            <input style={styles.input} placeholder="Nhập tên bác sĩ hoặc chuyên khoa..." />
          </>
        ) : (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <p style={{ margin: 0, color: '#24D5DB', fontWeight: 'bold' }}>Tải lên hình ảnh triệu chứng để AI gợi ý bác sĩ</p>
            <input type="file" style={{ marginTop: '10px' }} />
          </div>
        )}
      </div>

      {/* Danh sách bác sĩ giả lập để Nhân xem giao diện */}
      <div style={styles.doctorGrid}>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} style={styles.docCard}>
            <div style={{ height: '180px', backgroundColor: '#e2e8f0' }}></div>
            <div style={styles.docInfo}>
              <h4 style={{ margin: '0 0 5px 0' }}>Bác sĩ Nguyễn Văn A</h4>
              <p style={{ color: '#24D5DB', fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Chuyên khoa Da liễu</p>
              <div style={{ display: 'flex', gap: '5px', fontSize: '12px', color: '#777' }}>
                <span>⭐ 4.8</span> | <span>📍 TP. Đà Nẵng</span>
              </div>
            </div>
            <button style={styles.btnView}>Xem hồ sơ</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
