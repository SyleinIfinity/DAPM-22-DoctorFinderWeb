import { Link, useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'

export function DoctorDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const maBacSi = Number(params.maBacSi)

  // Dữ liệu mô phỏng dựa trên thiết kế mẫu
  const doctor = {
    id: maBacSi,
    name: "TS.BS. Nguyễn Thanh Tùng",
    title: "Tiến sĩ Y khoa",
    specialty: "Chuyên khoa Thần kinh",
    hospital: "BV Bạch Mai — Hà Nội",
    rating: 4.9,
    reviews: "1,2k",
    experience: "14",
    fee: "320k",
    cchn: "HN-TK-2010-0085",
    status: "Hồ sơ đã duyệt · Nhận bệnh online"
  }

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <main style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="container" style={{ padding: '20px', textAlign: 'center' }}>
          URL không hợp lệ hoặc không tìm thấy bác sĩ.
        </div>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <PageHeader 
        title="Hồ sơ bác sĩ" 
        right={<Link to="/app/home" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: '600' }}>Tìm bác sĩ khác</Link>} 
      />

      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        {/* 1. Phần Header Profile */}
        <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', position: 'relative' }}>
            {/* Avatar NT Circle */}
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              backgroundColor: '#0d9488', color: '#fff', 
              display: 'grid', placeItems: 'center', fontSize: '36px', fontWeight: 'bold',
              position: 'relative', flexShrink: 0
            }}>
              NT
              <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'grid', placeItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <span style={{ color: '#0d9488', fontSize: '14px' }}>✔</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a202c' }}>{doctor.name}</h1>
              <span style={{ backgroundColor: '#ccfbf1', color: '#0f766e', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
                {doctor.title}
              </span>
              <p style={{ margin: '12px 0 4px 0', color: '#4a5568', fontWeight: '500' }}>{doctor.specialty}</p>
              <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>{doctor.hospital}</p>
              
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '600', fontSize: '14px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                {doctor.status}
              </div>
            </div>

            <button style={{ border: '1px solid #0d9488', background: '#fff', color: '#0d9488', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
              <span>❤</span> Theo dõi
            </button>
          </div>
        </div>

        {/* 2. Stats Grid - Bốn thẻ chỉ số (Giống bản app mẫu) */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', 
          backgroundColor: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden',
          marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {[
            { label: 'Năm KN', value: doctor.experience },
            { label: 'Đánh giá', value: doctor.rating },
            { label: 'Lượt khám', value: doctor.reviews },
            { label: 'Phí khám', value: doctor.fee },
          ].map((stat, idx) => (
            <div key={idx} style={{ backgroundColor: '#fff', padding: '16px', textAlign: 'center' }}>
              <div style={{ color: '#0d9488', fontSize: '20px', fontWeight: '700' }}>{stat.value}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 3. Phần thông tin chi tiết & CCHN */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
           {/* Giả lập phần thông tin có các icon nhịp tim như trong ảnh */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: '40px', height: '40px', backgroundColor: '#f0fdfa', borderRadius: '10px', display: 'grid', placeItems: 'center', color: '#0d9488' }}>
                  ⚡
                </div>
              ))}
           </div>

           <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f0fdfa', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>📋</div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Số CCHN</div>
                <div style={{ fontWeight: '600', color: '#475569' }}>{doctor.cchn}</div>
              </div>
           </div>
        </div>

        {/* Thẻ đệm tránh che Footer */}
        <div style={{ height: '150px' }}></div>
      </div>

      {/* 4. Bottom Action Bar - Cố định ở dưới màn hình */}
      <div style={{
        position: 'fixed', bottom: '20px', left: 0, right: 0,
        zIndex: 1000, display: 'flex', justifyContent: 'center', pointerEvents: 'none'
      }}>
        <div style={{ 
          width: 'calc(100% - 40px)', maxWidth: '600px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
          padding: '12px 20px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          display: 'flex', gap: '12px', alignItems: 'center', pointerEvents: 'auto'
        }}>
          <button 
            onClick={() => navigate(`/app/messages/new`)}
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', backgroundColor: '#f1f5f9', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            💬
          </button>
          <button 
            onClick={() => navigate(`/app/doctors/${maBacSi}/calendar`)}
            style={{ flex: 1, height: '48px', borderRadius: '15px', border: 'none', backgroundColor: '#f0fdfa', color: '#0d9488', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
          >
            📅 Xem lịch
          </button>
          <button 
            onClick={() => navigate(`/app/doctors/${maBacSi}/book`)}
            style={{ flex: 1.5, height: '48px', borderRadius: '15px', border: 'none', backgroundColor: '#0d9488', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
          >
            Đặt lịch ngay
          </button>
        </div>
      </div>
    </main>
  )
}