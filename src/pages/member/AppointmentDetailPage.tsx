import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentDetail, Review } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

function normalizeTime(value: string): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

function appointmentEnded(a: AppointmentDetail): boolean {
  if (!a.ngayCuThe) return false
  const dt = new Date(`${a.ngayCuThe}T${a.gioKetThuc}`)
  if (!Number.isFinite(dt.getTime())) return false
  return Date.now() > dt.getTime()
}

// Hàm hỗ trợ màu sắc trạng thái
function getStatusStyles(status: string) {
  switch (status) {
    case 'CHO_XAC_NHAN': return { color: '#ffc107', bg: 'rgba(255,193,7,0.1)', text: 'ĐANG CHỜ' }
    case 'DA_XAC_NHAN': return { color: '#24D5DB', bg: 'rgba(36,213,219,0.1)', text: 'ĐÃ XÁC NHẬN' }
    case 'DA_HUY': return { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)', text: 'ĐÃ HỦY' }
    case 'TU_CHOI': return { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)', text: 'BỊ TỪ CHỐI' }
    default: return { color: '#999', bg: 'rgba(153,153,153,0.1)', text: status }
  }
}

export function AppointmentDetailPage() {
  const params = useParams()
  const qc = useQueryClient()
  const { session } = useAuth()
  const maNguoiDung = session?.maNguoiDung ?? null

  // Chấp nhận cả maPhieuDatLich hoặc id từ params
  const maPhieuDatLich = Number(params.maPhieuDatLich || params.id)

  const [error, setError] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [soSao, setSoSao] = useState(5)
  const [noiDung, setNoiDung] = useState('')

  // --- MOCK DATA ĐỂ NHÂN KIỂM TRA UI NGAY ---
  const mockDetail: AppointmentDetail = {
    maPhieuDatLich: maPhieuDatLich,
    maBacSi: 1,
    hoTenBacSi: "BS. Nguyễn Văn A",
    chuyenKhoa: "Nội tổng quát",
    ngayCuThe: "2026-05-10",
    gioBatDau: "08:00:00",
    gioKetThuc: "09:00:00",
    trangThaiPhieu: "DA_XAC_NHAN",
    tenCoSoYTe: "Bệnh viện Chợ Rẫy",
    diaChiLamViec: "201B Nguyễn Chí Thanh, Quận 5, TP.HCM",
    trieuChungGhiChu: "Tôi bị đau đầu và sốt nhẹ từ tối qua.",
    lyDoTuChoi: null,
  } as any

  const query = useQuery({
    queryKey: ['appointment-detail', maPhieuDatLich],
    queryFn: async () => {
        // Tạm thời dùng mock để Nhân thấy UI luôn
        return { data: mockDetail }
        // return (await api.get<AppointmentDetail>(`/api/appointments/${maPhieuDatLich}`)).data
    },
    enabled: Number.isFinite(maPhieuDatLich) && maPhieuDatLich > 0,
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<AppointmentDetail>(`/api/appointments/${maPhieuDatLich}/cancel`)
      return res.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointment-detail', maPhieuDatLich] })
      if (maNguoiDung) {
        await qc.invalidateQueries({ queryKey: ['appointments', maNguoiDung, 'upcoming'] })
        await qc.invalidateQueries({ queryKey: ['appointments', maNguoiDung, 'history'] })
      }
      alert('Đã hủy lịch hẹn')
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const a = query.data?.data || mockDetail
      if (!a) throw new Error('Thiếu dữ liệu phiếu')
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      const res = await api.post<Review>('/api/reviews', {
        maNguoiDung,
        maBacSi: a.maBacSi,
        soSao,
        noiDung: noiDung.trim() || null,
      })
      return res.data
    },
    onSuccess: async (created) => {
      alert('Đánh giá thành công')
      setShowReview(false)
      setNoiDung('')
      await qc.invalidateQueries({ queryKey: ['doctor-rating', created.maBacSi] })
      await qc.invalidateQueries({ queryKey: ['doctor-reviews', created.maBacSi] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const detail = query.data?.data || mockDetail
  const statusStyle = getStatusStyles(detail?.trangThaiPhieu || '')

  const canCancel = detail && (detail.trangThaiPhieu === 'CHO_XAC_NHAN' || detail.trangThaiPhieu === 'DA_XAC_NHAN')
  const canReview = useMemo(() => {
    if (!detail) return false
    if (detail.trangThaiPhieu !== 'DA_XAC_NHAN') return false
    return appointmentEnded(detail)
  }, [detail])

  if (!Number.isFinite(maPhieuDatLich) || maPhieuDatLich <= 0) {
    return (
      <div style={{ padding: '20px' }}>
        <PageHeader title="Chi tiết phiếu" />
        <div className="card" style={{ color: '#ff4d4f', textAlign: 'center' }}>URL không hợp lệ hoặc thiếu mã phiếu.</div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <PageHeader 
        title="Chi tiết phiếu" 
        right={<Link to="/app/appointments" style={{ color: '#24D5DB', textDecoration: 'none' }}>Danh sách</Link>} 
      />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      
      {detail ? (
        <div className="stack" style={{ gap: '20px' }}>
          {/* PHẦN CHÍNH: GIỐNG CÁI PHIẾU KHÁM */}
          <div className="card stack" style={{ gap: '20px', borderTop: `6px solid ${statusStyle.color}`, borderRadius: '16px' }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '1px' }}>CHI TIẾT PHIẾU ĐẶT</div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>Mã phiếu: #{detail.maPhieuDatLich}</div>
            </div>

            <div style={{ 
              backgroundColor: statusStyle.bg, 
              padding: '15px', 
              borderRadius: '12px', 
              textAlign: 'center',
              border: `1px dashed ${statusStyle.color}` 
            }}>
              <div style={{ color: statusStyle.color, fontWeight: 'bold', fontSize: '1.1rem' }}>
                {statusStyle.text}
              </div>
            </div>

            <div className="stack" style={{ gap: '15px' }}>
              <div className="row-between">
                <span className="muted">Bác sĩ:</span>
                <span style={{ fontWeight: 'bold' }}>{detail.hoTenBacSi}</span>
              </div>
              <div className="row-between">
                <span className="muted">Chuyên khoa:</span>
                <span>{detail.chuyenKhoa}</span>
              </div>
              <div className="row-between">
                <span className="muted">Thời gian:</span>
                <span style={{ fontWeight: 'bold', color: '#24D5DB' }}>
                  {normalizeTime(detail.gioBatDau)} | {detail.ngayCuThe}
                </span>
              </div>
              
              <div style={{ height: '1px', backgroundColor: '#333' }} />

              <div className="stack" style={{ gap: '8px' }}>
                <span className="muted">Địa điểm:</span>
                <div style={{ fontWeight: '500' }}>{detail.tenCoSoYTe}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{detail.diaChiLamViec}</div>
              </div>

              {detail.trieuChungGhiChu && (
                <>
                  <div style={{ height: '1px', backgroundColor: '#333' }} />
                  <div className="stack" style={{ gap: '8px' }}>
                    <span className="muted">Triệu chứng/Ghi chú:</span>
                    <div style={{ backgroundColor: '#1a222d', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      "{detail.trieuChungGhiChu}"
                    </div>
                  </div>
                </>
              )}

              {detail.lyDoTuChoi && (
                 <div className="card" style={{ borderColor: '#ff4d4f', backgroundColor: 'rgba(255,77,79,0.05)' }}>
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginBottom: '5px' }}>Lý do từ chối:</div>
                    <div style={{ fontSize: '0.9rem' }}>{detail.lyDoTuChoi}</div>
                 </div>
              )}
            </div>

            {/* CÁC NÚT HÀNH ĐỘNG */}
            <div className="stack" style={{ gap: '10px', marginTop: '10px' }}>
              <div className="row" style={{ gap: '10px' }}>
                <Link className="btn" to={`/app/doctors/${detail.maBacSi}`} style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  Hồ sơ bác sĩ
                </Link>
                {canReview && (
                  <button className="btn btn-primary" style={{ flex: 1 }} type="button" onClick={() => setShowReview((v) => !v)}>
                    {showReview ? 'Đóng đánh giá' : 'Viết đánh giá'}
                  </button>
                )}
              </div>
              
              {canCancel && (
                <button 
                  className="btn" 
                  type="button" 
                  disabled={cancelMutation.isPending} 
                  onClick={() => { if(window.confirm('Bạn có chắc muốn hủy?')) cancelMutation.mutate() }}
                  style={{ border: '1px solid #ff4d4f', color: '#ff4d4f' }}
                >
                  {cancelMutation.isPending ? 'Đang hủy…' : 'HỦY PHIẾU ĐẶT LỊCH'}
                </button>
              )}
            </div>
          </div>

          {error ? <div className="card" style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}>{error}</div> : null}

          {/* FORM ĐÁNH GIÁ (CHỈ HIỆN KHI BẤM NÚT) */}
          {showReview && (
            <div className="card stack" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="title" style={{ color: '#24D5DB' }}>Gửi đánh giá bác sĩ</div>
              <div className="stack" style={{ gap: '15px' }}>
                <div className="stack" style={{ gap: '8px' }}>
                  <div className="label">Chọn số sao</div>
                  <select className="input" style={{ backgroundColor: '#1a222d' }} value={soSao} onChange={(e) => setSoSao(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Sao {n === 5 ? '⭐ (Tuyệt vời)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="stack" style={{ gap: '8px' }}>
                  <div className="label">Cảm nhận của bạn</div>
                  <textarea 
                    className="input" 
                    rows={3}
                    style={{ backgroundColor: '#1a222d', resize: 'none' }}
                    placeholder="Bác sĩ tư vấn nhiệt tình..."
                    value={noiDung} 
                    onChange={(e) => setNoiDung(e.target.value)} 
                  />
                </div>
                <button className="btn btn-primary" type="button" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>
                  {reviewMutation.isPending ? 'Đang gửi…' : 'GỬI ĐÁNH GIÁ NGAY'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}