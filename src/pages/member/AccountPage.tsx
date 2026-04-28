import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { AccountDoctorInfo, DoctorProfile } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'
import {
  DoctorAvatar,
  DoctorNotice,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  getProfileStatusMeta,
} from '../doctor/doctorUi'

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
type NoticeState = { tone: 'success' | 'danger'; title: string; description: string } | null
type ProfileTab = 'doctor' | 'user'

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
  { k: 'moTaBanThan', label: 'Mô tả bản thân (tùy chọn)' },
]

export function AccountPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session, logout } = useAuth()

  const role = (session?.vaiTro || '').toUpperCase()
  const isDoctor = role === 'BAC_SI'
  const isAdmin = role === 'ADMIN' || role === 'QUAN_TRI_VIEN'

  const maTaiKhoan = session?.maTaiKhoan ?? null
  const maNguoiDung = session?.maNguoiDung ?? null
  const maBacSi = session?.maBacSi ?? null

  const [activeTab, setActiveTab] = useState<ProfileTab>('doctor')
  const [userNotice, setUserNotice] = useState<NoticeState>(null)
  const [doctorNotice, setDoctorNotice] = useState<NoticeState>(null)

  const accountQuery = useQuery({
    queryKey: ['account', maTaiKhoan],
    queryFn: async () => (await api.get<AccountDoctorInfo>(`/api/auth/account/${maTaiKhoan}/doctor`)).data,
    enabled: !!maTaiKhoan,
  })

  const doctorProfileQuery = useQuery({
    queryKey: ['doctor-by-id', maBacSi],
    queryFn: async () => (await api.get<DoctorProfile>(`/api/doctors/${maBacSi}`)).data,
    enabled: isDoctor && !!maBacSi,
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
    const d = accountQuery.data
    setUserForm({
      hoLot: d.hoLot || '',
      ten: d.ten || '',
      soDienThoai: d.soDienThoai || '',
      email: d.email || '',
      cccd: d.cccd || '',
      anhDaiDien: d.anhDaiDien || '',
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
      setUserNotice({ tone: 'success', title: 'Cập nhật thành công', description: 'Thông tin cá nhân đã được lưu lại.' })
      await qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => setUserNotice({ tone: 'danger', title: 'Không thể cập nhật', description: getApiErrorMessage(err) }),
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
    if (!accountQuery.data?.coTaiKhoanBacSi) return
    const d = accountQuery.data
    setDoctorForm({
      chuyenKhoa: d.chuyenKhoa || '',
      trinhDoChuyenMon: d.trinhDoChuyenMon || '',
      loaiHinhBacSi: d.loaiHinhBacSi || '',
      tenCoSoYTe: d.tenCoSoYTe || '',
      diaChiLamViec: d.diaChiLamViec || '',
      maChungChiHanhNghe: d.maChungChiHanhNghe || '',
      moTaBanThan: d.moTaBanThan || '',
    })
  }, [accountQuery.data])

  useEffect(() => {
    if (isDoctor) setActiveTab('doctor')
  }, [isDoctor])

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
        return (await api.post('/api/auth/upgrade-to-doctor', { maTaiKhoan, thongTinBacSi: payload })).data
      }
      const form = new FormData()
      form.append('thongTinBacSi', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      for (const u of uploads) {
        form.append('tieuDeTaiLieu', u.tieuDe)
        form.append('files', u.file)
      }
      return (
        await api.post('/api/auth/upgrade-to-doctor', form, {
          params: { maTaiKhoan },
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data
    },
    onSuccess: async (data) => {
      setDoctorNotice({
        tone: 'success',
        title: data?.message || 'Gửi yêu cầu thành công',
        description: 'Hồ sơ bác sĩ của bạn đang chờ đội quản trị xét duyệt.',
      })
      await qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => setDoctorNotice({ tone: 'danger', title: 'Không thể gửi yêu cầu', description: getApiErrorMessage(err) }),
  })

  const updateDoctorMutation = useMutation({
    mutationFn: async () => {
      if (!maBacSi) throw new Error('Thiếu maBacSi')
      return (
        await api.put(`/api/doctors/${maBacSi}`, {
          chuyenKhoa: doctorForm.chuyenKhoa.trim(),
          trinhDoChuyenMon: doctorForm.trinhDoChuyenMon.trim(),
          loaiHinhBacSi: doctorForm.loaiHinhBacSi.trim(),
          tenCoSoYTe: doctorForm.tenCoSoYTe.trim(),
          diaChiLamViec: doctorForm.diaChiLamViec.trim() || null,
          maChungChiHanhNghe: doctorForm.maChungChiHanhNghe.trim(),
          moTaBanThan: doctorForm.moTaBanThan.trim() || null,
        })
      ).data
    },
    onSuccess: async () => {
      setDoctorNotice({
        tone: 'success',
        title: 'Cập nhật hồ sơ bác sĩ thành công',
        description: 'Thông tin chuyên môn đã được lưu lại.',
      })
      await qc.invalidateQueries({ queryKey: ['doctor-by-id', maBacSi] })
      await qc.invalidateQueries({ queryKey: ['account', maTaiKhoan] })
    },
    onError: (err) => setDoctorNotice({ tone: 'danger', title: 'Không thể cập nhật hồ sơ bác sĩ', description: getApiErrorMessage(err) }),
  })

  const profileStatus = useMemo(() => {
    const s = accountQuery.data?.trangThaiHoSo
    return s ? getProfileStatusMeta(s) : null
  }, [accountQuery.data])

  const doctorProfile = doctorProfileQuery.data ?? accountQuery.data ?? null
  const fullName = `${userForm.hoLot} ${userForm.ten}`.trim() || session?.tenDangNhap || 'Tài khoản của bạn'
  const canSwitchToUser = Boolean(session?.maNguoiDung)
  const canSwitchToDoctor = Boolean(session?.maBacSi || accountQuery.data?.coTaiKhoanBacSi)

  const goToUserIdentity = () => {
    setActiveTab('user')
    navigate('/app/account')
  }

  const goToDoctorIdentity = () => {
    setActiveTab('doctor')
    navigate('/doctor/account')
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isDoctor) {
    return (
      <>
        <PageHeader title="Tài khoản" right={<Link to={isAdmin ? '/admin/pending-doctors' : '/app/home'}>Home</Link>} />

        <div className="card stack">
          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div style={{ fontWeight: 900 }}>TK #{session?.maTaiKhoan}</div>
              <div className="muted">
                {session?.tenDangNhap} • role: <b>{session?.vaiTro}</b>
              </div>
            </div>
            <button className="btn btn-danger" type="button" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>

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

          {!isAdmin && session?.maBacSi ? (
            <div className="row">
              <Link className="btn" to="/app/doctor-status">
                Trạng thái hồ sơ bác sĩ
              </Link>
            </div>
          ) : null}
        </div>

        <div style={{ height: 12 }} />

        <div className="card stack">
          <div className="title">Hồ sơ người dùng</div>
          {accountQuery.isLoading ? <div className="muted">Đang tải…</div> : null}
          <div className="grid">
            {USER_FIELDS.map((f) => (
              <div className="stack" key={f.k}>
                <div className="label">{f.label}</div>
                <input className="input" value={(userForm as any)[f.k]} onChange={(e) => setUserForm((p) => ({ ...p, [f.k]: e.target.value }))} />
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
            <span className="chip">Trạng thái: {accountQuery.data?.trangThaiHoSo ?? '—'}</span>
          </div>
          {accountQuery.data?.coTaiKhoanBacSi ? (
            <div className="muted">Đã có hồ sơ bác sĩ (maBacSi: {accountQuery.data.maBacSi}).</div>
          ) : (
            <div className="muted">Chưa có hồ sơ bác sĩ.</div>
          )}
          <div className="grid">
            {DOCTOR_FIELDS.map((f) => (
              <div className="stack" key={f.k}>
                <div className="label">{f.label}</div>
                <input className="input" value={(doctorForm as any)[f.k]} onChange={(e) => setDoctorForm((p) => ({ ...p, [f.k]: e.target.value }))} />
              </div>
            ))}
          </div>
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
        </div>
      </>
    )
  }

  return (
    <div className="doctor-page">
      <div className="doctor-page-heading">
        <div className="doctor-page-heading__body">
          <div className="doctor-eyebrow">Tài khoản</div>
          <h1 className="doctor-page-heading__title">Hồ sơ cá nhân</h1>
          <p className="doctor-page-heading__description">
            Quản lý 2 thân phận trên cùng một tài khoản: hồ sơ bác sĩ và hồ sơ người dùng.
          </p>
        </div>
        <div className="doctor-page-heading__actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="doctor-button doctor-button--danger" type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="doctor-panel" style={{ marginBottom: 16 }}>
        <div className="doctor-button-row" style={{ justifyContent: 'space-between' }}>
          <div className="doctor-button-row">
            <button className={activeTab === 'doctor' ? 'doctor-button doctor-button--primary' : 'doctor-button doctor-button--secondary'} type="button" onClick={() => setActiveTab('doctor')}>
              Hồ sơ bác sĩ
            </button>
            <button className={activeTab === 'user' ? 'doctor-button doctor-button--primary' : 'doctor-button doctor-button--secondary'} type="button" onClick={() => setActiveTab('user')}>
              Hồ sơ người dùng
            </button>
          </div>
          <div className="doctor-button-row">
            {activeTab === 'doctor' ? (
              <button className="doctor-button doctor-button--ghost" type="button" onClick={goToUserIdentity} disabled={!canSwitchToUser}>
                Chuyển về tài khoản người dùng
              </button>
            ) : (
              <button className="doctor-button doctor-button--ghost" type="button" onClick={goToDoctorIdentity} disabled={!canSwitchToDoctor}>
                Chuyển sang hồ sơ bác sĩ
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'doctor' ? (
        <>
          {accountQuery.isLoading ? <DoctorNotice tone="info" title="Đang tải thông tin tài khoản" description="Vui lòng chờ trong giây lát." /> : null}
          {accountQuery.isError ? <DoctorNotice tone="danger" title="Không thể tải tài khoản" description={getApiErrorMessage(accountQuery.error)} /> : null}

          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Hồ sơ bác sĩ</div>
              <h2 className="doctor-hero__title">{doctorProfile?.hoTenDayDu || fullName}</h2>
              <p className="doctor-hero__subtitle">
                {session?.tenDangNhap} · TK #{session?.maTaiKhoan}
                <br />
                {doctorProfile?.email || userForm.email}
              </p>
              <div className="doctor-button-row">
                <Link className="doctor-button doctor-button--secondary doctor-button-link" to="/doctor/home">
                  Về trang chủ
                </Link>
                <Link className="doctor-button doctor-button--ghost doctor-button-link" to="/doctor/documents">
                  Quản lý minh chứng
                </Link>
              </div>
            </div>

            <div className="doctor-hero__aside">
              <div className="doctor-profile-strip">
                <DoctorAvatar name={doctorProfile?.hoTenDayDu || fullName} imageUrl={userForm.anhDaiDien || null} />
                <div>
                  <h3 className="doctor-profile-strip__name">{doctorProfile?.hoTenDayDu || fullName}</h3>
                  <p className="doctor-profile-strip__meta">
                    {doctorForm.chuyenKhoa || 'Chưa cập nhật chuyên khoa'}
                    <br />
                    {doctorForm.tenCoSoYTe || 'Chưa cập nhật cơ sở y tế'}
                  </p>
                </div>
              </div>
              {profileStatus ? <DoctorStatusBadge label={profileStatus.label} tone={profileStatus.tone} /> : null}
              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã CCHN</span>
                  <span className="doctor-keyfact__value">{doctorForm.maChungChiHanhNghe || '—'}</span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Trình độ</span>
                  <span className="doctor-keyfact__value">{doctorForm.trinhDoChuyenMon || '—'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="doctor-metrics-grid">
            <DoctorStatCard label="Vai trò" value="Bác sĩ" hint={`Mã tài khoản #${session?.maTaiKhoan}`} />
            <DoctorStatCard label="Trạng thái hồ sơ" value={profileStatus?.label ?? '—'} hint={profileStatus?.description} />
            <DoctorStatCard label="Chuyên khoa" value={doctorForm.chuyenKhoa || '—'} hint="Hiển thị công khai với bệnh nhân." />
            <DoctorStatCard label="Cơ sở y tế" value={doctorForm.tenCoSoYTe || '—'} hint={doctorForm.diaChiLamViec || 'Địa chỉ chưa cập nhật.'} />
          </section>

          <DoctorPanel title="Thông tin bác sĩ" description="Các trường chuyên môn hiển thị trong hồ sơ hành nghề và trên giao diện bệnh nhân.">
            {doctorNotice ? <DoctorNotice tone={doctorNotice.tone} title={doctorNotice.title} description={doctorNotice.description} /> : null}
            {accountQuery.data?.coTaiKhoanBacSi ? (
              <DoctorNotice
                tone="info"
                title={`Hồ sơ đang liên kết · Mã bác sĩ #${accountQuery.data.maBacSi}`}
                description="Chỉnh sửa thông tin bên dưới và nhấn lưu để cập nhật hồ sơ chuyên môn."
              />
            ) : (
              <DoctorNotice tone="warning" title="Chưa có hồ sơ bác sĩ" description="Điền đầy đủ thông tin và nhấn gửi yêu cầu để mở hồ sơ hành nghề." />
            )}

            <div className="doctor-form-grid">
              {DOCTOR_FIELDS.map((f) => (
                <div className={`doctor-field${f.k === 'moTaBanThan' ? ' doctor-field--full' : ''}`} key={f.k}>
                  <label className="doctor-label" htmlFor={`doc-${f.k}`}>
                    {f.label}
                  </label>
                  {f.k === 'moTaBanThan' ? (
                    <textarea
                      id={`doc-${f.k}`}
                      className="doctor-textarea"
                      value={(doctorForm as any)[f.k]}
                      onChange={(e) => setDoctorForm((p) => ({ ...p, [f.k]: e.target.value }))}
                      placeholder="Giới thiệu ngắn về kinh nghiệm và phương pháp điều trị của bạn…"
                    />
                  ) : (
                    <input id={`doc-${f.k}`} className="doctor-input" value={(doctorForm as any)[f.k]} onChange={(e) => setDoctorForm((p) => ({ ...p, [f.k]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>

            {!accountQuery.data?.coTaiKhoanBacSi ? (
              <div className="doctor-field">
                <span className="doctor-label">Minh chứng kèm theo (tùy chọn)</span>
                <label className="doctor-file-picker">
                  <div>
                    <div className="doctor-file-picker__title">Chọn tệp từ thiết bị</div>
                    <div className="doctor-file-picker__meta">Chứng chỉ hành nghề, bằng cấp, giấy tờ liên quan.</div>
                  </div>
                  <div className="doctor-file-picker__meta">{uploads.length > 0 ? `Đã chọn ${uploads.length} tệp` : 'Chưa chọn tệp nào'}</div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setUploads(files.map((file) => ({ file, tieuDe: file.name })))
                    }}
                  />
                </label>
              </div>
            ) : null}

            <div className="doctor-button-row">
              {accountQuery.data?.coTaiKhoanBacSi ? (
                <>
                  <button className="doctor-button doctor-button--primary" type="button" disabled={!maBacSi || updateDoctorMutation.isPending} onClick={() => { setDoctorNotice(null); updateDoctorMutation.mutate() }}>
                    {updateDoctorMutation.isPending ? 'Đang lưu…' : 'Lưu hồ sơ bác sĩ'}
                  </button>
                  {maBacSi ? (
                    <Link className="doctor-button doctor-button--ghost doctor-button-link" to={`/app/doctors/${maBacSi}`}>
                      Xem hồ sơ công khai
                    </Link>
                  ) : null}
                </>
              ) : (
                <button className="doctor-button doctor-button--primary" type="button" disabled={!maTaiKhoan || upgradeMutation.isPending} onClick={() => { setDoctorNotice(null); upgradeMutation.mutate() }}>
                  {upgradeMutation.isPending ? 'Đang gửi…' : 'Gửi yêu cầu mở hồ sơ bác sĩ'}
                </button>
              )}
            </div>
          </DoctorPanel>
        </>
      ) : (
        <>
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Hồ sơ người dùng</div>
              <h2 className="doctor-hero__title">{fullName}</h2>
              <p className="doctor-hero__subtitle">
                {session?.tenDangNhap} · TK #{session?.maTaiKhoan}
                <br />
                {userForm.email || 'Chưa có email'}
              </p>
              <div className="doctor-button-row">
                <button className="doctor-button doctor-button--secondary" type="button" onClick={() => setActiveTab('doctor')}>
                  Quay lại hồ sơ bác sĩ
                </button>
                <button className="doctor-button doctor-button--ghost" type="button" onClick={goToDoctorIdentity} disabled={!canSwitchToDoctor}>
                  Chuyển sang hồ sơ bác sĩ
                </button>
              </div>
            </div>

            <div className="doctor-hero__aside">
              <div className="doctor-profile-strip">
                <DoctorAvatar name={fullName} imageUrl={userForm.anhDaiDien || null} />
                <div>
                  <h3 className="doctor-profile-strip__name">{fullName}</h3>
                  <p className="doctor-profile-strip__meta">
                    {session?.vaiTro || 'Người dùng'}
                    <br />
                    Tài khoản #{session?.maTaiKhoan}
                  </p>
                </div>
              </div>
              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Thân phận hiện tại</span>
                  <span className="doctor-keyfact__value">Người dùng</span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Chuyển đổi vai trò</span>
                  <span className="doctor-keyfact__value">{canSwitchToDoctor ? 'Có thể sang hồ sơ bác sĩ' : 'Chỉ có hồ sơ người dùng'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="doctor-metrics-grid">
            <DoctorStatCard label="Thân phận" value="Người dùng" hint="Thông tin cá nhân hiển thị trong luồng đặt lịch và tra cứu." />
            <DoctorStatCard label="Số điện thoại" value={userForm.soDienThoai || '—'} hint="Dùng để nhận phản hồi và thông báo lịch hẹn." />
            <DoctorStatCard label="CCCD" value={userForm.cccd || '—'} hint="Dữ liệu định danh cá nhân của bạn." />
            <DoctorStatCard label="Email" value={userForm.email || '—'} hint="Kênh liên hệ chính của tài khoản." />
          </section>

          <DoctorPanel
            title="Hồ sơ người dùng"
            description="Chỉnh sửa thông tin cá nhân trước khi chuyển sang hồ sơ bác sĩ hoặc quay về tài khoản người dùng."
          >
            {userNotice ? <DoctorNotice tone={userNotice.tone} title={userNotice.title} description={userNotice.description} /> : null}
            <div className="doctor-form-grid">
              {USER_FIELDS.map((f) => (
                <div className="doctor-field" key={f.k}>
                  <label className="doctor-label" htmlFor={`user-${f.k}`}>
                    {f.label}
                  </label>
                  <input
                    id={`user-${f.k}`}
                    className="doctor-input"
                    value={(userForm as any)[f.k]}
                    onChange={(e) => setUserForm((p) => ({ ...p, [f.k]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="doctor-button-row" style={{ justifyContent: 'space-between' }}>
              <button className="doctor-button doctor-button--danger" type="button" onClick={handleLogout}>
                Đăng xuất
              </button>
              <div className="doctor-button-row">
                <button className="doctor-button doctor-button--primary" type="button" disabled={!maNguoiDung || updateUserMutation.isPending} onClick={() => { setUserNotice(null); updateUserMutation.mutate() }}>
                  {updateUserMutation.isPending ? 'Đang lưu…' : 'Lưu thông tin cá nhân'}
                </button>
                <button className="doctor-button doctor-button--secondary" type="button" onClick={goToDoctorIdentity} disabled={!canSwitchToDoctor}>
                  Chuyển sang hồ sơ bác sĩ
                </button>
              </div>
            </div>
          </DoctorPanel>
        </>
      )}
    </div>
  )
}
