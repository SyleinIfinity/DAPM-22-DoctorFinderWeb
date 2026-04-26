import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/http'
import type { OtpSendResponse, OtpVerifyResponse, RegisterResponse } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { getApiErrorMessage } from '../utils/errors'

type RegisterKind = 'USER' | 'DOCTOR'
type Step = 'USER_INFO' | 'DOCTOR_INFO' | 'OTP'

type UserInfo = {
  tenDangNhap: string
  matKhau: string
  xacNhanMatKhau: string
  hoLot: string
  ten: string
  soDienThoai: string
  email: string
  cccd: string
  anhDaiDien: string
}

type DoctorInfo = {
  chuyenKhoa: string
  trinhDoChuyenMon: string
  loaiHinhBacSi: string
  tenCoSoYTe: string
  diaChiLamViec: string
  maChungChiHanhNghe: string
  moTaBanThan: string
}

type DocumentDraft = {
  tieuDe: string
  file: File
}

const OTP_PURPOSE = 'REGISTER'

export function RegisterPage() {
  const navigate = useNavigate()

  const [kind, setKind] = useState<RegisterKind>('USER')
  const [step, setStep] = useState<Step>('USER_INFO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<UserInfo>({
    tenDangNhap: '',
    matKhau: '',
    xacNhanMatKhau: '',
    hoLot: '',
    ten: '',
    soDienThoai: '',
    email: '',
    cccd: '',
    anhDaiDien: '',
  })
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({
    chuyenKhoa: '',
    trinhDoChuyenMon: '',
    loaiHinhBacSi: '',
    tenCoSoYTe: '',
    diaChiLamViec: '',
    maChungChiHanhNghe: '',
    moTaBanThan: '',
  })
  const [documents, setDocuments] = useState<DocumentDraft[]>([])

  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const canGoOtp = useMemo(() => info.email.trim().length > 0, [info.email])

  async function sendOtp() {
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<OtpSendResponse>('/api/auth/otp/send', {
        email: info.email.trim(),
        purpose: OTP_PURPOSE,
        forceResend: true,
      })
      if (!res.data.otpSent) throw new Error(res.data.message || 'Không gửi được OTP')
      setOtpSent(true)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtpAndRegister() {
    setError(null)
    setLoading(true)
    try {
      const verifyRes = await api.post<OtpVerifyResponse>('/api/auth/otp/verify', {
        email: info.email.trim(),
        purpose: OTP_PURPOSE,
        otpCode: otpCode.trim(),
      })
      if (!verifyRes.data.verified || !verifyRes.data.otpProofToken) {
        throw new Error(verifyRes.data.message || 'OTP không hợp lệ')
      }

      const otpProofToken = verifyRes.data.otpProofToken

      if (kind === 'USER') {
        const regRes = await api.post<RegisterResponse>('/api/auth/register/user', {
          thongTinNguoiDung: {
            ...info,
            tenDangNhap: info.tenDangNhap.trim(),
            hoLot: info.hoLot.trim(),
            ten: info.ten.trim(),
            soDienThoai: info.soDienThoai.trim(),
            email: info.email.trim(),
            cccd: info.cccd.trim(),
            anhDaiDien: info.anhDaiDien.trim() || null,
          },
          otpProofToken,
        })
        if (!regRes.data.registered) throw new Error(regRes.data.message || 'Đăng ký thất bại')
        alert(regRes.data.message || 'Đăng ký thành công')
        navigate('/login', { replace: true })
        return
      }

      const regDoctorRes = await api.post<RegisterResponse>('/api/auth/register/doctor', {
        thongTinNguoiDung: {
          ...info,
          tenDangNhap: info.tenDangNhap.trim(),
          hoLot: info.hoLot.trim(),
          ten: info.ten.trim(),
          soDienThoai: info.soDienThoai.trim(),
          email: info.email.trim(),
          cccd: info.cccd.trim(),
          anhDaiDien: info.anhDaiDien.trim() || null,
        },
        thongTinBacSi: {
          chuyenKhoa: doctorInfo.chuyenKhoa.trim(),
          trinhDoChuyenMon: doctorInfo.trinhDoChuyenMon.trim(),
          loaiHinhBacSi: doctorInfo.loaiHinhBacSi.trim(),
          tenCoSoYTe: doctorInfo.tenCoSoYTe.trim(),
          diaChiLamViec: doctorInfo.diaChiLamViec.trim() || null,
          maChungChiHanhNghe: doctorInfo.maChungChiHanhNghe.trim(),
          moTaBanThan: doctorInfo.moTaBanThan.trim() || null,
        },
        otpProofToken,
      })

      if (!regDoctorRes.data.registered) {
        throw new Error(regDoctorRes.data.message || 'Đăng ký bác sĩ thất bại')
      }

      // Upload minh chứng (nếu có) sau khi tạo bác sĩ
      if (regDoctorRes.data.maBacSi && documents.length > 0) {
        for (const doc of documents) {
          const form = new FormData()
          form.append('tieuDeTaiLieu', doc.tieuDe)
          form.append('file', doc.file)
          await api.post(`/api/doctors/${regDoctorRes.data.maBacSi}/documents`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
      }

      alert(regDoctorRes.data.message || 'Đăng ký thành công')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function renderUserInfo() {
    return (
      <div className="card stack">
        <div className="row-between">
          <div className="chip">Bước 1: Thông tin người dùng</div>
          <select
            className="input"
            style={{ width: 220 }}
            value={kind}
            onChange={(e) => {
              const nextKind = e.target.value as RegisterKind
              setKind(nextKind)
              if (nextKind === 'USER') setStep('USER_INFO')
            }}
          >
            <option value="USER">Người dùng thành viên</option>
            <option value="DOCTOR">Đăng ký kèm Bác sĩ</option>
          </select>
        </div>

        {[
          { k: 'tenDangNhap', label: 'Tên đăng nhập', placeholder: 'VD: khanhsky' },
          { k: 'hoLot', label: 'Họ lót', placeholder: 'VD: Phan Văn' },
          { k: 'ten', label: 'Tên', placeholder: 'VD: Khánh' },
          { k: 'soDienThoai', label: 'SĐT (10 số)', placeholder: 'VD: 0901234567' },
          { k: 'email', label: 'Email', placeholder: 'VD: khanh@gmail.com' },
          { k: 'cccd', label: 'CCCD (12 số)', placeholder: 'VD: 012345678901' },
          { k: 'anhDaiDien', label: 'Ảnh đại diện (URL, tùy chọn)', placeholder: 'https://...' },
        ].map((f) => (
          <div className="stack" key={f.k}>
            <div className="label">{f.label}</div>
            <input
              className="input"
              value={(info as any)[f.k]}
              onChange={(e) => setInfo((prev) => ({ ...prev, [f.k]: e.target.value }))}
              placeholder={f.placeholder}
              required={f.k !== 'anhDaiDien'}
            />
          </div>
        ))}

        <div className="stack">
          <div className="label">Mật khẩu</div>
          <input
            className="input"
            type="password"
            value={info.matKhau}
            onChange={(e) => setInfo((prev) => ({ ...prev, matKhau: e.target.value }))}
            required
          />
        </div>
        <div className="stack">
          <div className="label">Xác nhận mật khẩu</div>
          <input
            className="input"
            type="password"
            value={info.xacNhanMatKhau}
            onChange={(e) => setInfo((prev) => ({ ...prev, xacNhanMatKhau: e.target.value }))}
            required
          />
        </div>

        <div className="row">
          {kind === 'DOCTOR' ? (
            <button className="btn btn-primary" type="button" onClick={() => setStep('DOCTOR_INFO')}>
              Tiếp tục
            </button>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              disabled={!canGoOtp || loading}
              onClick={async () => {
                setStep('OTP')
                await sendOtp()
              }}
            >
              Đăng ký
            </button>
          )}
          <Link className="btn" to="/login">
            Đã có tài khoản
          </Link>
        </div>
      </div>
    )
  }

  function renderDoctorInfo() {
    return (
      <div className="card stack">
        <div className="row-between">
          <div className="chip">Bước 2: Thông tin bác sĩ</div>
          <button className="btn" type="button" onClick={() => setStep('USER_INFO')}>
            Quay lại
          </button>
        </div>

        {[
          { k: 'chuyenKhoa', label: 'Chuyên khoa', placeholder: 'VD: Da liễu' },
          { k: 'trinhDoChuyenMon', label: 'Trình độ chuyên môn', placeholder: 'VD: ThS. BS' },
          { k: 'loaiHinhBacSi', label: 'Loại hình bác sĩ', placeholder: 'VD: Bác sĩ tư' },
          { k: 'tenCoSoYTe', label: 'Cơ sở y tế', placeholder: 'VD: Bệnh viện A' },
          { k: 'diaChiLamViec', label: 'Địa chỉ làm việc (tùy chọn)', placeholder: '...' },
          { k: 'maChungChiHanhNghe', label: 'Mã CCHN', placeholder: 'VD: CCHN-001' },
          { k: 'moTaBanThan', label: 'Mô tả (tùy chọn)', placeholder: '...' },
        ].map((f) => (
          <div className="stack" key={f.k}>
            <div className="label">{f.label}</div>
            <input
              className="input"
              value={(doctorInfo as any)[f.k]}
              onChange={(e) => setDoctorInfo((prev) => ({ ...prev, [f.k]: e.target.value }))}
              placeholder={f.placeholder}
              required={!String(f.label).includes('tùy chọn')}
            />
          </div>
        ))}

        <div className="stack">
          <div className="label">Minh chứng (tùy chọn, upload sau khi tạo tài khoản)</div>
          <input
            className="input"
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              setDocuments(
                files.map((file) => ({
                  file,
                  tieuDe: file.name,
                })),
              )
            }}
          />
          {documents.length > 0 ? (
            <div className="muted">Đã chọn {documents.length} tệp.</div>
          ) : null}
        </div>

        <button
          className="btn btn-primary"
          type="button"
          disabled={!canGoOtp || loading}
          onClick={async () => {
            setStep('OTP')
            await sendOtp()
          }}
        >
          Đăng ký
        </button>
      </div>
    )
  }

  function renderOtp() {
    return (
      <div className="card stack">
        <div className="row-between">
          <div className="chip">Nhập OTP</div>
          <button
            className="btn"
            type="button"
            onClick={() => setStep(kind === 'DOCTOR' ? 'DOCTOR_INFO' : 'USER_INFO')}
          >
            Quay lại
          </button>
        </div>

        <div className="muted">
          OTP gửi tới email: <b>{info.email.trim()}</b>
        </div>

        <div className="stack">
          <div className="label">Mã OTP</div>
          <input
            className="input"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Nhập 6 số"
          />
        </div>

        <div className="row">
          <button className="btn btn-primary" type="button" disabled={loading} onClick={verifyOtpAndRegister}>
            {loading ? 'Đang xác thực…' : 'Xác thực & Tạo tài khoản'}
          </button>
          <button className="btn" type="button" disabled={loading} onClick={sendOtp}>
            {otpSent ? 'Gửi lại OTP' : 'Gửi OTP'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <PageHeader title="Đăng ký" right={<Link to="/login">Đăng nhập</Link>} />

      {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

      <div className="stack" style={{ marginTop: 12 }}>
        {step === 'USER_INFO' ? renderUserInfo() : null}
        {step === 'DOCTOR_INFO' ? renderDoctorInfo() : null}
        {step === 'OTP' ? renderOtp() : null}
      </div>
    </div>
  )
}

