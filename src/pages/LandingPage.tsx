import { Link } from 'react-router-dom'

export function LandingPage() {
  const styles = {
    wrapper: { minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' },
    nav: { display: 'flex', justifyContent: 'space-between', padding: '20px 5%', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    logo: { fontSize: '24px', fontWeight: 'bold', color: '#24D5DB', textDecoration: 'none' },
    hero: { padding: '80px 5%', textAlign: 'center' as const, backgroundColor: '#f0fdfa' },
    h1: { fontSize: '42px', fontWeight: '800', color: '#1a202c', marginBottom: '20px' },
    highlight: { color: '#24D5DB' },
    p: { fontSize: '18px', color: '#4a5568', maxWidth: '700px', margin: '0 auto 40px auto', lineHeight: '1.6' },
    btnPrimary: { padding: '14px 35px', backgroundColor: '#24D5DB', color: '#fff', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', boxShadow: '0 4px 14px rgba(36, 213, 219, 0.4)' },
    btnSecondary: { padding: '14px 35px', color: '#4a5568', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginLeft: '15px', border: '1px solid #e2e8f0' },
    section: { padding: '60px 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' },
    card: { padding: '30px', borderRadius: '20px', backgroundColor: '#fff', border: '1px solid #f0f0f0', textAlign: 'center' as const, transition: '0.3s' },
    icon: { fontSize: '40px', marginBottom: '15px', display: 'block' }
  }

  return (
    <div style={styles.wrapper}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>DoctorFinder</Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/login" style={{ color: '#4a5568', textDecoration: 'none', fontWeight: 'bold' }}>Đăng nhập</Link>
          <Link to="/register" style={{ backgroundColor: '#24D5DB', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Tham gia ngay</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={styles.hero}>
        <h1 style={styles.h1}>Chăm sóc <span style={styles.highlight}>Sức khỏe</span> của bạn <br/> theo cách hiện đại nhất</h1>
        <p style={styles.p}>
          Tìm kiếm bác sĩ chuyên khoa giỏi nhất, đặt lịch khám nhanh chóng và tư vấn trực tiếp ngay tại nhà. Giải pháp y tế thông minh cho người Việt.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/login" style={styles.btnPrimary}>Bắt đầu sử dụng</Link>
          <Link to="/register" style={styles.btnSecondary}>Tìm hiểu thêm</Link>
        </div>
      </header>

      {/* Features List */}
      <div style={styles.section}>
        <div style={styles.card}>
          <span style={styles.icon}>🔍</span>
          <h3 style={{ marginBottom: '10px', color: '#2d3748' }}>Tìm kiếm thông minh</h3>
          <p style={{ color: '#718096', fontSize: '14px' }}>Tìm bác sĩ qua tên hoặc hình ảnh cực kỳ nhanh chóng.</p>
        </div>
        <div style={styles.card}>
          <span style={styles.icon}>📅</span>
          <h3 style={{ marginBottom: '10px', color: '#2d3748' }}>Đặt lịch 24/7</h3>
          <p style={{ color: '#718096', fontSize: '14px' }}>Xác thực lịch hẹn qua OTP, quản lý khung giờ khám linh hoạt.</p>
        </div>
        <div style={styles.card}>
          <span style={styles.icon}>💬</span>
          <h3 style={{ marginBottom: '10px', color: '#2d3748' }}>Tư vấn trực tiếp</h3>
          <p style={{ color: '#718096', fontSize: '14px' }}>Nhắn tin trực tiếp với bác sĩ để nhận lời khuyên sức khỏe.</p>
        </div>
      </div>

      {/* Footer mỏng */}
      <footer style={{ textAlign: 'center', padding: '40px', color: '#a0aec0', fontSize: '14px', borderTop: '1px solid #f7fafc' }}>
        © 2026 DoctorFinder - Hệ thống kết nối y tế chuyên nghiệp
      </footer>
    </div>
  )
}