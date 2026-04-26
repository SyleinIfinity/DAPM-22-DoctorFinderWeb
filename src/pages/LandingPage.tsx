import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

export function LandingPage() {
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <PageHeader title="Finder Doctor" />
      <div className="card stack">
        <div>
          <div className="title">Chào mừng bạn</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Theo luồng UX, khách vãng lai chỉ có thể đăng ký hoặc đăng nhập để sử dụng chức năng.
          </div>
        </div>
        <div className="row">
          <Link className="btn btn-primary" to="/login">
            Đăng nhập
          </Link>
          <Link className="btn" to="/register">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  )
}

