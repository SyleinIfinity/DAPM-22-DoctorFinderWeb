import { Link, useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'

export function DoctorDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const maBacSi = Number(params.maBacSi)

  // Giả lập dữ liệu
  const doctor = {
    id: maBacSi,
    name: "BS. Nguyễn Văn A",
    specialty: "Nội tổng quát - Tim mạch",
    rating: 4.9,
    reviews: 156,
    experience: "15 năm kinh nghiệm",
    hospital: "Bệnh viện Chợ Rẫy",
    description: "Bác sĩ chuyên khoa II với nhiều năm kinh nghiệm trong điều trị các bệnh lý cao huyết áp, tiểu đường và các vấn đề tim mạch mãn tính. Từng tu nghiệp tại Pháp và có nhiều công trình nghiên cứu khoa học.",
    avatar: "https://via.placeholder.com/150"
  }

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <>
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  return (
    <div style={{ paddingBottom: '80px' }}> {/* Padding để không bị che bởi nút sticky */}
      <PageHeader 
        title="Hồ sơ bác sĩ" 
        right={<Link to="/app/home" style={{ color: '#24D5DB', textDecoration: 'none', fontWeight: '500' }}>Tìm bác sĩ khác</Link>} 
      />

      {/* 1. Thông tin chung */}
      <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
        <img 
          src={doctor.avatar} 
          alt={doctor.name} 
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #24D5DB' }} 
        />
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{doctor.name}</h2>
          <p style={{ color: '#24D5DB', fontWeight: '600', margin: '5px 0' }}>{doctor.specialty}</p>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <span>⭐ {doctor.rating} ({doctor.reviews} đánh giá)</span>
            <span style={{ margin: '0 10px' }}>|</span>
            <span>{doctor.experience}</span>
          </div>
        </div>
      </div>

      {/* 2. Mô tả & Chi tiết */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Giới thiệu</h3>
        <p style={{ lineHeight: '1.6', color: '#444' }}>{doctor.description}</p>
        
        <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', marginTop: '20px' }}>Nơi công tác</h3>
        <p style={{ fontWeight: '500' }}>{doctor.hospital}</p>
      </div>

      {/* 3. Đánh giá từ bệnh nhân (Gợi ý thêm) */}
      <div className="card">
        <h3>Đánh giá gần đây</h3>
        <div style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
          <div style={{ color: '#ffc107' }}>⭐⭐⭐⭐⭐</div>
          <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>"Bác sĩ rất tận tâm và giải thích kỹ càng."</p>
          <small style={{ color: '#999' }}>- Bệnh nhân ẩn danh</small>
        </div>
      </div>

      {/* 4. CTA Buttons - Giữa màn hình bên phải */}
      <div style={{
        position: 'fixed',
        right: '20px', 
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        zIndex: 1000,
      }}>
        {/* Nút Nhắn tin hình tròn */}
        <button 
          onClick={() => navigate(`/app/messages/new`)}
          title="Nhắn tin"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '2px solid #24D5DB',
            backgroundColor: '#1a222d',
            color: '#24D5DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s'
          }}
        >
          {/* Bạn có thể thay chữ bằng Icon nếu muốn */}
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>CHAT</span>
        </button>

        {/* Nút Đặt lịch khám - Xoay dọc hoặc để ngang ngắn */}
        <button 
          onClick={() => navigate(`/app/doctors/${maBacSi}/slots`)}
          style={{
            writingMode: 'vertical-rl', // Xoay chữ dọc cho phong cách
            textOrientation: 'mixed',
            padding: '20px 12px',
            borderRadius: '25px',
            border: 'none',
            backgroundColor: '#24D5DB',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(36, 213, 219, 0.4)',
            letterSpacing: '1px'
          }}
        >
          ĐẶT LỊCH KHÁM
        </button>
      </div>
    </div>
  )
}