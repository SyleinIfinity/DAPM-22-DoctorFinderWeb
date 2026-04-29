import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api/http'
import type { DoctorImageSearchResult, DoctorProfile } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

type SearchMode = 'TEXT' | 'IMAGE'

export function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [mode, setMode] = useState<SearchMode>('TEXT')
  const [keyword, setKeyword] = useState('')
  const [chuyenKhoa, setChuyenKhoa] = useState('')
  const [diaChiLamViec, setDiaChiLamViec] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [textResults, setTextResults] = useState<DoctorProfile[]>([])
  const [imageResults, setImageResults] = useState<DoctorImageSearchResult[]>([])

  async function searchText() {
    setError(null)
    setLoading(true)

    // BƯỚC 1: Tạm thời tạo dữ liệu giả để hiện lên màn hình
    const mockDoctors = [
      {
        maBacSi: 1,
        hoTenDayDu: "BS. Nguyễn Văn A",
        chuyenKhoa: "Nội tổng quát",
        tenCoSoYTe: "Bệnh viện Chợ Rẫy",
        diaChiLamViec: "Quận 5, TP.HCM",
      },
      {
        maBacSi: 2,
        hoTenDayDu: "BS. Trần Thị B",
        chuyenKhoa: "Nhi khoa",
        tenCoSoYTe: "Bệnh viện Nhi Đồng",
        diaChiLamViec: "Quận 10, TP.HCM",
      }
    ]

    // BƯỚC 2: Gán dữ liệu giả này vào state thay vì đợi API
    setTimeout(() => {
      setTextResults(mockDoctors as any)
      setLoading(false)
    }, 500) // Tạo độ trễ 0.5s cho giống thật
  }
  //Tạm thời bỏ API để bạn tập trung làm UI, sau này mình sẽ hướng dẫn cách gọi API thật để lấy dữ liệu bác sĩ dựa trên tiêu chí tìm kiếm
  // async function searchText() {
  //   setError(null)
  //   setLoading(true)
  //   try {
  //     const res = await api.get<DoctorProfile[]>('/api/doctors/search', {
  //       params: {
  //         keyword: keyword.trim() || undefined,
  //         chuyenKhoa: chuyenKhoa.trim() || undefined,
  //         diaChiLamViec: diaChiLamViec.trim() || undefined,
  //         trangThaiHoSo: 'DA_DUYET',
  //         limit: 20,
  //         offset: 0,
  //       },
  //     })
  //     setTextResults(res.data || [])
  //   } catch (err) {
  //     setError(getApiErrorMessage(err))
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  async function searchByImage() {
    setError(null)
    setLoading(true)
    try {
      if (!imageFile) throw new Error('Vui lòng chọn ảnh')
      const form = new FormData()
      form.append('image', imageFile)
      form.append('limit', '20')
      const res = await api.post<DoctorImageSearchResult[]>(
        '/api/doctors/search-by-image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      setImageResults(res.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Trang chính"
        right={
          session?.maBacSi && session?.vaiTro?.toUpperCase() !== 'BAC_SI' ? (
            <Link className="chip" to="/app/doctor-status">
              Hồ sơ bác sĩ: xem trạng thái
            </Link>
          ) : null
        }
      />

      <div className="card stack">
        <div className="tabs">
          <button
            className={mode === 'TEXT' ? 'tab tab-active' : 'tab'}
            onClick={() => setMode('TEXT')}
            type="button"
          >
            Tìm kiếm thường
          </button>
          <button
            className={mode === 'IMAGE' ? 'tab tab-active' : 'tab'}
            onClick={() => setMode('IMAGE')}
            type="button"
          >
            Tìm kiếm thông minh (tải ảnh)
          </button>
        </div>

        {mode === 'TEXT' ? (
          <>
            <div className="stack">
              <div className="label">Từ khóa / tên</div>
              <input className="input" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div className="grid">
              <div className="stack">
                <div className="label">Chuyên khoa</div>
                <input className="input" value={chuyenKhoa} onChange={(e) => setChuyenKhoa(e.target.value)} />
              </div>
              <div className="stack">
                <div className="label">Địa chỉ</div>
                <input
                  className="input"
                  value={diaChiLamViec}
                  onChange={(e) => setDiaChiLamViec(e.target.value)}
                />
              </div>
              <div className="stack">
                <div className="label">Hành động</div>
                <button className="btn btn-primary" onClick={searchText} disabled={loading} type="button">
                  {loading ? 'Đang tìm…' : 'Tìm kiếm'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stack">
              <div className="label">Tải ảnh lên để tìm kiếm</div>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <button className="btn btn-primary" onClick={searchByImage} disabled={loading} type="button">
              {loading ? 'Đang tìm…' : 'Tìm kiếm'}
            </button>
          </>
        )}

        {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}
      </div>

      <div style={{ height: 12 }} />

      <div className="card row">
        <Link className="btn" to="/app/doctors/recent">
          Bác sĩ vừa xem
        </Link>
        <Link className="btn" to="/app/doctors/suggested">
          Bác sĩ gợi ý
        </Link>
      </div>

      <div style={{ height: 12 }} />

      <div className="stack">
        {mode === 'TEXT' ? (
          <>
            {textResults.length === 0 ? (
              <div className="muted">Chưa có kết quả. Hãy nhập tiêu chí và nhấn “Tìm kiếm”.</div>
            ) : (
              textResults.map((d) => (
                <div key={d.maBacSi} className="card row-between">
                  <div className="stack" style={{ gap: 4 }}>
                    <div style={{ fontWeight: 900 }}>{d.hoTenDayDu}</div>
                    <div className="muted">
                      {d.chuyenKhoa} • {d.tenCoSoYTe}
                    </div>
                    <div className="muted">{d.diaChiLamViec || '—'}</div>
                  </div>
                  <button className="btn" type="button" onClick={() => navigate(`/app/doctors/${d.maBacSi}`)}>
                    Xem
                  </button>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {imageResults.length === 0 ? (
              <div className="muted">Chưa có kết quả. Hãy chọn ảnh và nhấn “Tìm kiếm”.</div>
            ) : (
              imageResults.map((r) => (
                <div key={r.bacSi.maBacSi} className="card row-between">
                  <div className="stack" style={{ gap: 4 }}>
                    <div style={{ fontWeight: 900 }}>{r.bacSi.hoTenDayDu}</div>
                    <div className="muted">
                      {r.bacSi.chuyenKhoa} • {r.bacSi.tenCoSoYTe}
                    </div>
                    <div className="muted">
                      Similarity: <b>{Math.round(r.similarityScore * 100)}%</b>
                    </div>
                  </div>
                  <button className="btn" type="button" onClick={() => navigate(`/app/doctors/${r.bacSi.maBacSi}`)}>
                    Xem
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  )
}
