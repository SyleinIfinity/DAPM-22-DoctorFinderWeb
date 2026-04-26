import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AccountDoctorInfo, DoctorProfile } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

type UpgradeDoctorInfo = {
  chuyenKhoa: string
  trinhDoChuyenMon: string
  loaiHinhBacSi: string
  tenCoSoYTe: string
  diaChiLamViec: string
  maChungChiHanhNghe: string
  moTaBanThan: string
}

type UploadDraft = { tieuDe: string; file: File }

export function AccountPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session, logout } = useAuth()

  const role = (session?.vaiTro || '').toUpperCase()
  const isDoctor = role === 'BAC_SI'
  const isAdmin = role === 'ADMIN' || role === 'QUAN_TRI_VIEN'
  const base = isDoctor ? '/doctor' : isAdmin ? '/admin' : '/app'

  const maTaiKhoan = session?.maTaiKhoan ?? null
  const maNguoiDung = session?.maNguoiDung ?? null
  const maBacSi = session?.maBacSi ?? null

  const [error, setError] = useState<string | null>(null)

  const accountQuery = useQuery({
    queryKey: ['account', maTaiKhoan],
    queryFn: async () => (await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`)).data,
    enabled: !!maTaiKhoan,
  })

  const [userForm, setUserForm] = useState({
    hoLot: '',
    ten: '',
    soDienThoai: '',
    email: '',
    cccd: '',
    anhDaiDien: '',
  })

  useEffect(() => {
    if (!accountQuery.data) return
    setUserForm({
      hoLot: accountQuery.data.hoLot || '',
      ten: accountQuery.data.ten || '',
      soDienThoai: accountQuery.data.soDienThoai || '',
      email: accountQuery.data.email || '',
      cccd: accountQuery.data.cccd || '',
      anhDaiDien: accountQuery.data.anhDaiDien || '',
    })
  }, [accountQuery.data])

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!maNguoiDung) throw new Error('Thiếu maNguoiDung')
      const res = await api.put(`/api/users/${maNguoiDung}`, {
        hoLot: userForm.hoLot.trim(),
        ten: userForm.ten.trim(),
        soDienThoai: userForm.soDienThoai.trim(),
        email: userForm.email.trim(),
        cccd: userForm.cccd.trim(),
        anhDaiDien: userForm.anhDaiDien.trim() || null,
      })
      return res.data
    },
    onSuccess: async () => {
      alert('Cập nhật thành công')
      await qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const [doctorForm, setDoctorForm] = useState<UpgradeDoctorInfo>({
    chuyenKhoa: '',
    trinhDoChuyenMon: '',
    loaiHinhBacSi: '',
    tenCoSoYTe: '',
    diaChiLamViec: '',
    maChungChiHanhNghe: '',
    moTaBanThan: '',
  })
  const [uploads, setUploads] = useState<UploadDraft[]>([])

  useEffect(() => {
    if (!accountQuery.data) return
    if (!accountQuery.data.coTaiKhoanBacSi) return
    setDoctorForm({
      chuyenKhoa: accountQuery.data.chuyenKhoa || '',
      trinhDoChuyenMon: accountQuery.data.trinhDoChuyenMon || '',
      loaiHinhBacSi: accountQuery.data.loaiHinhBacSi || '',
      tenCoSoYTe: accountQuery.data.tenCoSoYTe || '',
      diaChiLamViec: accountQuery.data.diaChiLamViec || '',
      maChungChiHanhNghe: accountQuery.data.maChungChiHanhNghe || '',
      moTaBanThan: accountQuery.data.moTaBanThan || '',
    })
  }, [accountQuery.data])

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!maTaiKhoan) throw new Error('Thiếu maTaiKhoan')
      const payload = {
        chuyenKhoa: doctorForm.chuyenKhoa.trim(),
        trinhDoChuyenMon: doctorForm.trinhDoChuyenMon.trim(),
        loaiHinhBacSi: doctorForm.loaiHinhBacSi.trim(),
        tenCoSoYTe: doctorForm.tenCoSoYTe.trim(),
        diaChiLamViec: doctorForm.diaChiLamViec.trim() || null,
        maChungChiHanhNghe: doctorForm.maChungChiHanhNghe.trim(),
        moTaBanThan: doctorForm.moTaBanThan.trim() || null,
      }

      if (uploads.length === 0) {
        const res = await api.post('/api/auth/upgrade-to-doctor', {
          maTaiKhoan,
          thongTinBacSi: payload,
        })
        return res.data
      }

      const form = new FormData()
      form.append('thongTinBacSi', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      for (const u of uploads) {
        form.append('tieuDeTaiLieu', u.tieuDe)
        form.append('files', u.file)
      }

      const res = await api.post(`/api/auth/upgrade-to-doctor`, form, {
        params: { maTaiKhoan },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: async (data) => {
      alert(data?.message || 'Thành công')
      await qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const doctorProfileQuery = useQuery({
    queryKey: ['doctor-by-id', maBacSi],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/${maBacSi}`)).data,
    enabled: isDoctor && !!maBacSi,
  })

  const updateDoctorMutation = useMutation({
    mutationFn: async () => {
      if (!maBacSi) throw new Error('Thiếu maBacSi')
      const res = await api.put(`/api/doctors/${maBacSi}`, {
        chuyenKhoa: doctorForm.chuyenKhoa.trim(),
        trinhDoChuyenMon: doctorForm.trinhDoChuyenMon.trim(),
        loaiHinhBacSi: doctorForm.loaiHinhBacSi.trim(),
        tenCoSoYTe: doctorForm.tenCoSoYTe.trim(),
        diaChiLamViec: doctorForm.diaChiLamViec.trim() || null,
        maChungChiHanhNghe: doctorForm.maChungChiHanhNghe.trim(),
        moTaBanThan: doctorForm.moTaBanThan.trim() || null,
      })
      return res.data
    },
    onSuccess: async () => {
      alert('Cập nhật hồ sơ bác sĩ thành công')
      await qc.invalidateQueries({ queryKey: ['doctor-by-id', maBacSi] })
      await qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const doctorStatus = useMemo(() => {
    const s = accountQuery.data?.trangThaiHoSo
    return s ? s : '—'
  }, [accountQuery.data])

  return (
    <>
      <PageHeader title="Tài khoản" right={<Link to={`${base === '/admin' ? '/admin/pending-doctors' : `${base}/home`}`}>Home</Link>} />

      <div className="card stack">
        <div className="row-between">
          <div className="stack" style={{ gap: 4 }}>
            <div style={{ fontWeight: 900 }}>TK #{session?.maTaiKhoan}</div>
            <div className="muted">
              {session?.tenDangNhap} • role: <b>{session?.vaiTro}</b>
            </div>
          </div>
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Đăng xuất
          </button>
        </div>

        {isDoctor ? (
          <div className="row">
            <Link className="btn" to="/doctor/documents">
              Minh chứng
            </Link>
            <Link className="btn" to="/doctor/requests">
              Duyệt lịch hẹn
            </Link>
            <Link className="btn" to="/doctor/schedule">
              Lịch làm việc
            </Link>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="row">
            <Link className="btn" to="/admin/pending-doctors">
              Duyệt hồ sơ BS
            </Link>
            <Link className="btn" to="/admin/accounts">
              Quản lý tài khoản
            </Link>
          </div>
        ) : null}

        {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}
      </div>

      <div style={{ height: 12 }} />

      <div className="card stack">
        <div className="title">Hồ sơ người dùng</div>
        {accountQuery.isLoading ? <div className="muted">Đang tải…</div> : null}
        {accountQuery.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(accountQuery.error)}
          </div>
        ) : null}

        <div className="grid">
          {[
            { k: 'hoLot', label: 'Họ lót' },
            { k: 'ten', label: 'Tên' },
            { k: 'soDienThoai', label: 'SĐT' },
            { k: 'email', label: 'Email' },
            { k: 'cccd', label: 'CCCD' },
            { k: 'anhDaiDien', label: 'Ảnh đại diện (URL, tùy chọn)' },
          ].map((f) => (
            <div className="stack" key={f.k}>
              <div className="label">{f.label}</div>
              <input
                className="input"
                value={(userForm as any)[f.k]}
                onChange={(e) => setUserForm((prev) => ({ ...prev, [f.k]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-primary" type="button" disabled={!maNguoiDung || updateUserMutation.isPending} onClick={() => updateUserMutation.mutate()}>
          {updateUserMutation.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}
        </button>
      </div>

      <div style={{ height: 12 }} />

      <div className="card stack">
        <div className="row-between">
          <div className="title">Hồ sơ bác sĩ</div>
          <span className="chip">Trạng thái: {doctorStatus}</span>
        </div>

        {accountQuery.data?.coTaiKhoanBacSi ? (
          <div className="muted">
            Bạn đã có hồ sơ bác sĩ (maBacSi: {accountQuery.data.maBacSi}). Nếu chưa được duyệt, bạn vẫn đăng nhập với thân phận người dùng.
          </div>
        ) : (
          <div className="muted">
            Bạn chưa có hồ sơ bác sĩ. Theo UX, có thể “mở tài khoản bác sĩ” từ đây (1 tài khoản 2 thân phận).
          </div>
        )}

        <div className="grid">
          {[
            { k: 'chuyenKhoa', label: 'Chuyên khoa' },
            { k: 'trinhDoChuyenMon', label: 'Trình độ' },
            { k: 'loaiHinhBacSi', label: 'Loại hình' },
            { k: 'tenCoSoYTe', label: 'Cơ sở y tế' },
            { k: 'diaChiLamViec', label: 'Địa chỉ (tùy chọn)' },
            { k: 'maChungChiHanhNghe', label: 'Mã CCHN' },
            { k: 'moTaBanThan', label: 'Mô tả (tùy chọn)' },
          ].map((f) => (
            <div className="stack" key={f.k}>
              <div className="label">{f.label}</div>
              <input
                className="input"
                value={(doctorForm as any)[f.k]}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, [f.k]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {!isDoctor ? (
          <>
            <div className="stack">
              <div className="label">Minh chứng (tùy chọn)</div>
              <input
                className="input"
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setUploads(files.map((file) => ({ file, tieuDe: file.name })))
                }}
              />
              {uploads.length > 0 ? <div className="muted">Đã chọn {uploads.length} tệp.</div> : null}
            </div>

            <button className="btn btn-primary" type="button" disabled={!maTaiKhoan || upgradeMutation.isPending} onClick={() => upgradeMutation.mutate()}>
              {upgradeMutation.isPending ? 'Đang gửi…' : 'Gửi yêu cầu mở hồ sơ bác sĩ'}
            </button>
          </>
        ) : (
          <>
            <div className="muted">
              (Role bác sĩ) Có thể cập nhật hồ sơ trực tiếp qua API `PUT /api/doctors/{'{maBacSi}'}`.
            </div>
            <button className="btn btn-primary" type="button" disabled={!maBacSi || updateDoctorMutation.isPending} onClick={() => updateDoctorMutation.mutate()}>
              {updateDoctorMutation.isPending ? 'Đang lưu…' : 'Lưu hồ sơ bác sĩ'}
            </button>
            {doctorProfileQuery.data ? (
              <div className="chip">Hồ sơ hiện tại: {doctorProfileQuery.data.trangThaiHoSo}</div>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}

