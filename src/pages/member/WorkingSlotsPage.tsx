import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AppointmentDetail, DoctorProfile, WorkingSlot } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeTime(value: string): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

function slotAvailable(slot: WorkingSlot): boolean {
  const allowedSchedule = slot.trangThaiLich === 'SAP_DIEN_RA' || slot.trangThaiLich === 'DANG_DIEN_RA'
  if (!allowedSchedule) return false
  if (slot.trangThai === 'TRONG') return true
  if (slot.trangThai === 'DANG_GIU' && slot.khoaDen) {
    const until = new Date(slot.khoaDen).getTime()
    if (Number.isFinite(until) && until <= Date.now()) return true
  }
  return false
}

export function WorkingSlotsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()

  const maBacSi = Number(params.maBacSi)
  const maNguoiDung = session?.maNguoiDung ?? null

  const [date, setDate] = useState<string>(todayYmd())
  const [selected, setSelected] = useState<WorkingSlot | null>(null)
  const [loaiPhieu, setLoaiPhieu] = useState('KHAM')
  const [trieuChung, setTrieuChung] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 1. Giả lập thông tin bác sĩ
const doctorQuery = useQuery({
  queryKey: ['doctor', maBacSi],
  queryFn: async () => ({
    hoTenDayDu: "BS. Nguyễn Văn A",
    chuyenKhoa: "Nội tổng quát",
  } as DoctorProfile),
  enabled: true, // Ép nó luôn chạy
})

// 2. Giả lập danh sách khung giờ
const slotsQuery = useQuery({
  queryKey: ['working-slots', maBacSi, date],
  queryFn: async () => ([
    { maChiTiet: 1, gioBatDau: "08:00", gioKetThuc: "09:00", trangThai: "TRONG", trangThaiLich: "SAP_DIEN_RA" },
    { maChiTiet: 2, gioBatDau: "09:00", gioKetThuc: "10:00", trangThai: "TRONG", trangThaiLich: "SAP_DIEN_RA" },
    { maChiTiet: 3, gioBatDau: "10:00", gioKetThuc: "11:00", trangThai: "DA_DAT", trangThaiLich: "SAP_DIEN_RA" },
    { maChiTiet: 4, gioBatDau: "14:00", gioKetThuc: "15:00", trangThai: "TRONG", trangThaiLich: "SAP_DIEN_RA" },
    { maChiTiet: 5, gioBatDau: "15:00", gioKetThuc: "16:00", trangThai: "TRONG", trangThaiLich: "SAP_DIEN_RA" },
  ] as WorkingSlot[]),
  enabled: true,
})

  const sortedSlots = useMemo(() => {
    const slots = slotsQuery.data || []
    return [...slots].sort((a, b) => (a.gioBatDau || '').localeCompare(b.gioBatDau || ''))
  }, [slotsQuery.data])

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      if (!selected) throw new Error('Vui lòng chọn khung giờ')
      const res = await api.post<AppointmentDetail>('/api/appointments', {
        maNguoiDung,
        maChiTiet: selected.maChiTiet,
        loaiPhieu: loaiPhieu.trim() || 'KHAM',
        trieuChungGhiChu: trieuChung.trim() || null,
      })
      return res.data
    },
    onSuccess: (data) => {
      navigate(`/app/appointments/${data.maPhieuDatLich}`)
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!Number.isFinite(maBacSi) || maBacSi <= 0) {
    return (
      <div style={{ padding: '20px' }}>
        <PageHeader title="Lịch làm việc" />
        <div className="card" style={{ textAlign: 'center', color: '#ff4d4f' }}>URL không hợp lệ.</div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <PageHeader 
        title="Chọn lịch" 
        right={<Link to={`/app/doctors/${maBacSi}`} style={{ color: '#24D5DB', textDecoration: 'none' }}>Hồ sơ bác sĩ</Link>} 
      />

      <div className="card stack">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div className="stack" style={{ gap: 4 }}>
            <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{doctorQuery.data?.hoTenDayDu || 'Đang tải...'}</div>
            <div style={{ color: '#24D5DB', fontWeight: '500' }}>{doctorQuery.data?.chuyenKhoa || ''}</div>
          </div>
          <div className="stack" style={{ gap: 4, alignItems: 'flex-end' }}>
            <div className="label">Chọn ngày</div>
            <input 
              className="input" 
              style={{ width: 160, backgroundColor: '#1a222d', color: '#fff', border: '1px solid #333' }} 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
        </div>

        <div style={{ height: 20 }} />
        <div className="label" style={{ marginBottom: 10 }}>Khung giờ khả dụng</div>

        {slotsQuery.isLoading ? <div className="muted">Đang tải khung giờ…</div> : null}
        
        {sortedSlots.length === 0 && !slotsQuery.isLoading ? (
          <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>Không có khung giờ khả dụng cho ngày này.</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
            gap: '10px' 
          }}>
            {sortedSlots.map((s) => {
              const ok = slotAvailable(s)
              const active = selected?.maChiTiet === s.maChiTiet
              return (
                <button
                  key={s.maChiTiet}
                  type="button"
                  disabled={!ok}
                  onClick={() => setSelected(s)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: active ? 'none' : '1px solid #333',
                    backgroundColor: active ? '#24D5DB' : '#1a222d',
                    color: active ? '#fff' : (ok ? '#ccc' : '#555'),
                    cursor: ok ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    boxShadow: active ? '0 4px 12px rgba(36, 213, 219, 0.3)' : 'none'
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{normalizeTime(s.gioBatDau)}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{ok ? 'TRỐNG' : s.trangThai}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ height: 20 }} />

      <div className="card stack">
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
          Thông tin phiếu đặt lịch
        </h3>
        
        {!maNguoiDung ? (
          <div style={{ color: '#ff4d4f', fontSize: '0.9rem' }}>⚠️ Bạn cần đăng nhập để thực hiện đặt lịch.</div>
        ) : null}

        <div className="grid">
          <div className="stack">
            <div className="label">Loại phiếu</div>
            <select 
              className="input" 
              style={{ backgroundColor: '#1a222d', color: '#fff', border: '1px solid #333' }}
              value={loaiPhieu} 
              onChange={(e) => setLoaiPhieu(e.target.value)}
            >
              <option value="KHAM">Khám bệnh</option>
              <option value="TU_VAN">Tư vấn từ xa</option>
              <option value="TAI_KHAM">Tái khám</option>
            </select>
          </div>
          <div className="stack">
            <div className="label">Ghi chú triệu chứng</div>
            <input 
              className="input" 
              style={{ backgroundColor: '#1a222d', color: '#fff', border: '1px solid #333' }}
              placeholder="Ví dụ: Đau đầu, sốt..." 
              value={trieuChung} 
              onChange={(e) => setTrieuChung(e.target.value)} 
            />
          </div>
        </div>

        <div style={{ height: 10 }} />
        
        <button
          className="btn"
          type="button"
          disabled={!maNguoiDung || !selected || createAppointmentMutation.isPending}
          onClick={() => {
            setError(null)
            createAppointmentMutation.mutate()
          }}
          style={{
            backgroundColor: (maNguoiDung && selected) ? '#24D5DB' : '#333',
            color: '#fff',
            fontWeight: 'bold',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '1rem',
            cursor: (maNguoiDung && selected) ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s'
          }}
        >
          {createAppointmentMutation.isPending ? 'Đang xử lý yêu cầu...' : 'XÁC NHẬN ĐẶT LỊCH'}
        </button>

        {error ? (
          <div className="card" style={{ borderColor: '#ff4d4f', color: '#ff4d4f', marginTop: '15px', fontSize: '0.9rem' }}>
            {error}
          </div>
        ) : null}
      </div>
    </div>
  )
}