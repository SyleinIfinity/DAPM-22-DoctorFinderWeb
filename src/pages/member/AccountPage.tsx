import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AccountDoctorInfo } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'


const USER_FIELDS = [
  { k: 'hoLot', label: 'Họ lót' },
  { k: 'ten', label: 'Tên' },
  { k: 'soDienThoai', label: 'Số điện thoại' },
  { k: 'email', label: 'Email' },
  { k: 'cccd', label: 'CCCD' },
  { k: 'anhDaiDien', label: 'Ảnh đại diện (URL, tùy chọn)' },
]

const DOCTOR_FIELDS = [
  { k: 'chuyenKhoa', label: 'Chuyên khoa' },
  { k: 'trinhDoChuyenMon', label: 'Trình độ chuyên môn' },
  { k: 'loaiHinhBacSi', label: 'Loại hình bác sĩ' },
  { k: 'tenCoSoYTe', label: 'Cơ sở y tế' },
  { k: 'diaChiLamViec', label: 'Địa chỉ làm việc (tùy chọn)' },
  { k: 'maChungChiHanhNghe', label: 'Mã chứng chỉ hành nghề' },
]

export function AccountPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session, logout } = useAuth()

  const maTaiKhoan = session?.maTaiKhoan ?? null
  const maNguoiDung = session?.maNguoiDung ?? null

  const [userForm, setUserForm] = useState<any>({
    hoLot: '', ten: '', soDienThoai: '', email: '', cccd: '', anhDaiDien: '',
  })
  const [doctorForm, setDoctorForm] = useState<any>({
    chuyenKhoa: '', trinhDoChuyenMon: '', loaiHinhBacSi: '', tenCoSoYTe: '',
    diaChiLamViec: '', maChungChiHanhNghe: '', moTaBanThan: '',
  })
  const [uploads, setUploads] = useState<{ tieuDe: string; file: File }[]>([])

  // --- Lấy dữ liệu tài khoản ---
  const accountQuery = useQuery({
    queryKey: ['account', maTaiKhoan],
    queryFn: async () => (await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`)).data,
    enabled: !!maTaiKhoan,
  })

  useEffect(() => {
    if (!accountQuery.data) return
    const d = accountQuery.data
    setUserForm({
      hoLot: d.hoLot || '',
      ten: d.ten || '',
      soDienThoai: d.soDienThoai || '',
      email: d.email || '',
      cccd: d.cccd || '',
      anhDaiDien: d.anhDaiDien || '',
    })
    if (d.coTaiKhoanBacSi) {
      setDoctorForm({
        chuyenKhoa: d.chuyenKhoa || '',
        trinhDoChuyenMon: d.trinhDoChuyenMon || '',
        loaiHinhBacSi: d.loaiHinhBacSi || '',
        tenCoSoYTe: d.tenCoSoYTe || '',
        diaChiLamViec: d.diaChiLamViec || '',
        maChungChiHanhNghe: d.maChungChiHanhNghe || '',
        moTaBanThan: d.moTaBanThan || '',
      })
    }
  }, [accountQuery.data])

  // --- Logic cập nhật User ---
  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      await api.put(`/api/users/${maNguoiDung}`, { ...userForm })
    },
    onSuccess: () => {
      alert('Cập nhật hồ sơ cá nhân thành công')
      qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => alert(getApiErrorMessage(err)),
  })

  // --- Logic gửi yêu cầu Bác sĩ ---
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!maTaiKhoan) throw new Error('Thiếu maTaiKhoan')
      const form = new FormData()
      form.append('thongTinBacSi', new Blob([JSON.stringify(doctorForm)], { type: 'application/json' }))
      for (const u of uploads) {
        form.append('tieuDeTaiLieu', u.tieuDe)
        form.append('files', u.file)
      }
      return (await api.post('/api/auth/upgrade-to-doctor', form, {
        params: { maTaiKhoan },
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: () => {
      alert('Gửi yêu cầu nâng cấp bác sĩ thành công. Vui lòng chờ duyệt.')
      qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => alert(getApiErrorMessage(err)),
  })

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <PageHeader title="Tài khoản" right={<Link to="/app/home">Home</Link>} />

      {/* BLOCK 1: THÔNG TIN TÀI KHOẢN */}
      <div className="card stack">
        <div className="row-between">
          <div className="stack" style={{ gap: 4 }}>
            <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>TK #{session?.maTaiKhoan}</div>
            <div className="muted">• role: {session?.vaiTro}</div>
          </div>
          <button className="btn btn-danger" type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ height: 20 }} />

      {/* BLOCK 2: HỒ SƠ NGƯỜI DÙNG */}
      <div className="card stack">
        <div className="title">Hồ sơ người dùng</div>
        <div className="grid">
          {USER_FIELDS.map((f) => (
            <div className="stack" key={f.k}>
              <div className="label">{f.label}</div>
              <input
                className="input"
                value={userForm[f.k]}
                onChange={(e) => setUserForm({ ...userForm, [f.k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: '10px' }}
          disabled={updateUserMutation.isPending}
          onClick={() => updateUserMutation.mutate()}
        >
          {updateUserMutation.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </button>
      </div>

      <div style={{ height: 20 }} />

      {/* BLOCK 3: HỒ SƠ BÁC SĨ */}
      <div className="card stack">
        <div className="row-between">
          <div className="title">Hồ sơ bác sĩ</div>
          <span className="chip" style={{ fontSize: '0.8rem' }}>
            Trạng thái: {accountQuery.data?.trangThaiHoSo ?? '—'}
          </span>
        </div>

        <div className="muted" style={{ marginBottom: '10px' }}>
          {accountQuery.data?.coTaiKhoanBacSi ? 'Đã liên kết hồ sơ bác sĩ.' : 'Chưa có hồ sơ bác sĩ.'}
        </div>

        <div className="grid">
          {DOCTOR_FIELDS.map((f) => (
            <div className="stack" key={f.k}>
              <div className="label">{f.label}</div>
              <input
                className="input"
                value={doctorForm[f.k]}
                onChange={(e) => setDoctorForm({ ...doctorForm, [f.k]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="stack" style={{ marginTop: '10px' }}>
          <div className="label">Mô tả bản thân (tùy chọn)</div>
          <textarea
            className="input"
            style={{ minHeight: '80px', resize: 'vertical' }}
            value={doctorForm.moTaBanThan}
            onChange={(e) => setDoctorForm({ ...doctorForm, moTaBanThan: e.target.value })}
            placeholder="Giới thiệu kinh nghiệm hành nghề của bạn..."
          />
        </div>

        <div className="stack" style={{ marginTop: '10px' }}>
          <div className="label">Minh chứng kèm theo (tùy chọn)</div>
          <input
            className="input"
            style={{ padding: '8px' }}
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              setUploads(files.map((file) => ({ file, tieuDe: file.name })))
            }}
          />
          {uploads.length > 0 && (
            <div className="muted" style={{ fontSize: '0.85rem' }}>Đã chọn {uploads.length} tệp.</div>
          )}
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: '15px' }}
          disabled={upgradeMutation.isPending}
          onClick={() => upgradeMutation.mutate()}
        >
          {upgradeMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu mở hồ sơ bác sĩ'}
        </button>
      </div>
    </div>
  )
}