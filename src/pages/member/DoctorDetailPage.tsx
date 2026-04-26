import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'

export function DoctorDetailPage() {
  const params = useParams()

  const maBacSi = Number(params.maBacSi)

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <>
        <PageHeader title="Hồ sơ bác sĩ" />
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Hồ sơ bác sĩ" right={<Link to="/app/home">Tìm bác sĩ</Link>} />
      <div className="card">Trang hồ sơ bác sĩ</div>
    </>
  )
}
