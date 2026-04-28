import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/http'
import type { OtpSendResponse, OtpVerifyResponse, RegisterResponse } from '../api/types'
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

  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const canGoOtp = useMemo(() => info.email.trim().length > 0, [info.email])

  const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdfa', padding: '40px 20px', fontFamily: 'Arial, sans-serif' },
    card: { backgroundColor: '#ffffff', padding: '32px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', width: '100%', maxWidth: '550px', borderTop: '10px solid #24D5DB' },
    title: { color: '#24D5DB', textAlign: 'center' as const, fontSize: '26px', fontWeight: 'bold', marginBottom: '8px' },
    stepper: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' },
    stepCircle: (active: boolean) => ({ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: active ? '#24D5DB' : '#e2e8f0', color: active ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }),
    label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px', color: '#4a5568', marginLeft: '4px' },
    input: { width: '100%', padding: '12px 16px', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' as const, outline: 'none' },
    btnPrimary: { width: '100%', padding: '14px', backgroundColor: '#24D5DB', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(36, 213, 219, 0.3)' },
    btnSecondary: { padding: '10px 20px', backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    error: { color: '#e53e3e', fontSize: '13px', textAlign: 'center' as const, marginBottom: '12px', fontWeight: '500', display: 'block' },
    select: { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: '2px solid #24D5DB', fontWeight: 'bold', color: '#24D5DB', outline: 'none' }
  }

  function validateUserInfo() {
    setError(null)
    // Regex kiểm tra định dạng email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!info.tenDangNhap || !info.hoLot || !info.ten || !info.soDienThoai || !info.email || !info.cccd || !info.matKhau) {
      setError("⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return false;
    }
    if (/\d/.test(info.hoLot) || /\d/.test(info.ten)) {
      setError("⚠️ Họ và tên phải là chữ !");
      return false;
    } 
    if (info.soDienThoai.length !== 10) {
      setError("⚠️ Số điện thoại phải đúng 10 chữ số!");
      return false;
    }

    if (!emailRegex.test(info.email)) {
      setError("⚠️ Định dạng email không hợp lệ (thiếu @ hoặc tên miền)!");
      return false;
    }
    
    if (info.cccd.length !== 12) {
      setError("⚠️ CCCD phải đúng 12 chữ số!");
      return false;
    }
    if (info.matKhau !== info.xacNhanMatKhau) {
      setError("⚠️ Mật khẩu xác nhận không trùng khớp!");
      return false;
    }
    return true;
  }

  async function sendOtp() {
    setError(null); setLoading(true)
    try {
      const res = await api.post<OtpSendResponse>('/api/auth/otp/send', { email: info.email.trim(), purpose: OTP_PURPOSE, forceResend: true })
      if (!res.data.otpSent) throw new Error(res.data.message || 'Không gửi được OTP')
      setOtpSent(true)
    } catch (err) { setError(getApiErrorMessage(err)) } finally { setLoading(false) }
  }

  async function verifyOtpAndRegister() {
    setError(null); setLoading(true)
    try {
      const verifyRes = await api.post<OtpVerifyResponse>('/api/auth/otp/verify', { email: info.email.trim(), purpose: OTP_PURPOSE, otpCode: otpCode.trim() })
      if (!verifyRes.data.verified || !verifyRes.data.otpProofToken) throw new Error(verifyRes.data.message || 'OTP không hợp lệ')
      const otpProofToken = verifyRes.data.otpProofToken
      if (kind === 'USER') {
        const regRes = await api.post<RegisterResponse>('/api/auth/register/user', { thongTinNguoiDung: { ...info, tenDangNhap: info.tenDangNhap.trim(), hoLot: info.hoLot.trim(), ten: info.ten.trim(), soDienThoai: info.soDienThoai.trim(), email: info.email.trim(), cccd: info.cccd.trim(), anhDaiDien: info.anhDaiDien.trim() || null }, otpProofToken })
        if (!regRes.data.registered) throw new Error(regRes.data.message || 'Đăng ký thất bại')
        alert('Đăng ký thành công'); navigate('/login', { replace: true }); return
      }
      const regDoctorRes = await api.post<RegisterResponse>('/api/auth/register/doctor', { thongTinNguoiDung: { ...info, tenDangNhap: info.tenDangNhap.trim(), hoLot: info.hoLot.trim(), ten: info.ten.trim(), soDienThoai: info.soDienThoai.trim(), email: info.email.trim(), cccd: info.cccd.trim(), anhDaiDien: info.anhDaiDien.trim() || null }, thongTinBacSi: { chuyenKhoa: doctorInfo.chuyenKhoa.trim(), trinhDoChuyenMon: doctorInfo.trinhDoChuyenMon.trim(), loaiHinhBacSi: doctorInfo.loaiHinhBacSi.trim(), tenCoSoYTe: doctorInfo.tenCoSoYTe.trim(), diaChiLamViec: doctorInfo.diaChiLamViec.trim() || null, maChungChiHanhNghe: doctorInfo.maChungChiHanhNghe.trim(), moTaBanThan: doctorInfo.moTaBanThan.trim() || null }, otpProofToken })
      if (!regDoctorRes.data.registered) throw new Error(regDoctorRes.data.message || 'Đăng ký bác sĩ thất bại')
      alert('Đăng ký thành công'); navigate('/login', { replace: true })
    } catch (err) { setError(getApiErrorMessage(err)) } finally { setLoading(false) }
  }

  function renderUserInfo() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <select style={styles.select} value={kind} onChange={(e) => { const nextKind = e.target.value as RegisterKind; setKind(nextKind); if (nextKind === 'USER') setStep('USER_INFO') }}>
          <option value="USER">👤 Người dùng thành viên</option>
          <option value="DOCTOR">🩺 Đăng ký làm Bác sĩ</option>
        </select>
        {[
          { k: 'tenDangNhap', label: 'Tên đăng nhập', placeholder: 'VD: khanhsky' },
          { k: 'hoLot', label: 'Họ lót', placeholder: 'VD: Nguyễn Trọng' },
          { k: 'ten', label: 'Tên', placeholder: 'VD: Nhân' },
          { k: 'soDienThoai', label: 'SĐT (10 số)', placeholder: 'VD: 0901234567', maxLength: 10 },
          { k: 'email', label: 'Email', placeholder: 'VD: nhan@gmail.com' },
          { k: 'cccd', label: 'CCCD (12 số)', placeholder: 'VD: 012345678901', maxLength: 12 },
        ].map((f) => (
          <div key={f.k}>
            <label style={styles.label}>{f.label}</label>
            <input 
              style={styles.input} 
              value={(info as any)[f.k]} 
              maxLength={(f as any).maxLength}
              onChange={(e) => {
                let val = e.target.value;
                if (f.k === 'soDienThoai' || f.k === 'cccd') val = val.replace(/[^0-9]/g, '');
                setInfo((prev) => ({ ...prev, [f.k]: val }));
              }} 
              placeholder={f.placeholder} 
            />
          </div>
        ))}
        <label style={styles.label}>Mật khẩu</label>
        <input style={styles.input} type="password" value={info.matKhau} onChange={(e) => setInfo((prev) => ({ ...prev, matKhau: e.target.value }))} />
        <label style={styles.label}>Xác nhận mật khẩu</label>
        <input style={styles.input} type="password" value={info.xacNhanMatKhau} onChange={(e) => setInfo((prev) => ({ ...prev, xacNhanMatKhau: e.target.value }))} />
        
        {error && <span style={styles.error}>{error}</span>}

        <button 
          style={styles.btnPrimary} 
          type="button" 
          disabled={loading} 
          onClick={async () => { 
            if (!validateUserInfo()) return;
            if(kind === 'DOCTOR') setStep('DOCTOR_INFO'); 
            else { setStep('OTP'); await sendOtp(); } 
          }}
        >
          {kind === 'DOCTOR' ? 'TIẾP TỤC' : 'GỬI OTP & ĐĂNG KÝ'}
        </button>
      </div>
    )
  }

  function renderDoctorInfo() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[
          { k: 'chuyenKhoa', label: 'Chuyên khoa', placeholder: 'VD: Da liễu' },
          { k: 'trinhDoChuyenMon', label: 'Trình độ chuyên môn', placeholder: 'VD: ThS. BS' },
          { k: 'loaiHinhBacSi', label: 'Loại hình bác sĩ', placeholder: 'VD: Bác sĩ tư' },
          { k: 'tenCoSoYTe', label: 'Cơ sở y tế', placeholder: 'VD: Bệnh viện A' },
          { k: 'maChungChiHanhNghe', label: 'Mã CCHN', placeholder: 'VD: CCHN-001' },
        ].map((f) => (
          <div key={f.k}>
            <label style={styles.label}>{f.label}</label>
            <input style={styles.input} value={(doctorInfo as any)[f.k]} onChange={(e) => setDoctorInfo((prev) => ({ ...prev, [f.k]: e.target.value }))} placeholder={f.placeholder} />
          </div>
        ))}
        
        {error && <span style={styles.error}>{error}</span>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button style={{...styles.btnSecondary, flex: 1}} onClick={() => { setError(null); setStep('USER_INFO'); }}>QUAY LẠI</button>
          <button style={{...styles.btnPrimary, flex: 2}} disabled={loading} onClick={async () => { setStep('OTP'); await sendOtp(); }}>GỬI OTP & ĐĂNG KÝ</button>
        </div>
      </div>
    )
  }

  function renderOtp() {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Mã OTP đã được gửi đến email:<br/><b style={{color: '#24D5DB'}}>{info.email}</b></p>
        <input style={{...styles.input, textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold'}} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" maxLength={6} />
        
        {error && <span style={styles.error}>{error}</span>}

        <button style={styles.btnPrimary} onClick={verifyOtpAndRegister}>{loading ? 'ĐANG XÁC THỰC...' : 'XÁC THỰC & HOÀN TẤT'}</button>
        <button style={{...styles.btnSecondary, width: '100%', marginTop: '15px'}} onClick={sendOtp}>GỬI LẠI MÃ</button>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.title}>ĐĂNG KÝ TÀI KHOẢN</div>
        <div style={styles.stepper}>
          <div style={styles.stepCircle(step === 'USER_INFO' || step === 'DOCTOR_INFO' || step === 'OTP')}>1</div>
          <div style={{ height: '2px', width: '20px', backgroundColor: step !== 'USER_INFO' ? '#24D5DB' : '#e2e8f0', alignSelf: 'center' }}></div>
          <div style={styles.stepCircle(step === 'DOCTOR_INFO' || step === 'OTP')}>2</div>
          <div style={{ height: '2px', width: '20px', backgroundColor: step === 'OTP' ? '#24D5DB' : '#e2e8f0', alignSelf: 'center' }}></div>
          <div style={styles.stepCircle(step === 'OTP')}>3</div>
        </div>

        {step === 'USER_INFO' && renderUserInfo()}
        {step === 'DOCTOR_INFO' && renderDoctorInfo()}
        {step === 'OTP' && renderOtp()}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#24D5DB', fontWeight: 'bold', textDecoration: 'none' }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}