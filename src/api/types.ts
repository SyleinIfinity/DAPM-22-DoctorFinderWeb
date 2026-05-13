export type OtpSendResponse = {
  email: string
  purpose: string
  status: string
  otpSent: boolean
  expiresInSeconds: number
  resendInSeconds: number
  message: string
}

export type OtpVerifyResponse = {
  email: string
  purpose: string
  status: string
  verified: boolean
  attemptsRemaining: number
  expiresInSeconds: number
  resendInSeconds: number
  otpProofToken: string | null
  message: string
}

export type RegisterResponse = {
  registered: boolean
  message: string
  maTaiKhoan: number | null
  tenDangNhap: string | null
  vaiTro: string | null
  trangThaiHoatDong: string | null
  maNguoiDung: number | null
  maBacSi: number | null
}

export type LoginResponse = {
  authenticated: boolean
  message: string
  maTaiKhoan: number | null
  tenDangNhap: string | null
  vaiTro: string | null
  trangThaiHoatDong: string | null
  maNguoiDung: number | null
  maBacSi: number | null
}

export type AccountDoctorInfo = {
  maTaiKhoan: number
  tenDangNhap: string
  vaiTro: string
  trangThaiHoatDong: string
  ngayTao: string
  maNguoiDung: number
  hoLot: string
  ten: string
  soDienThoai: string
  email: string
  cccd: string
  anhDaiDien: string | null
  coTaiKhoanBacSi: boolean
  maBacSi: number | null
  chuyenKhoa: string | null
  trinhDoChuyenMon: string | null
  loaiHinhBacSi: string | null
  tenCoSoYTe: string | null
  diaChiLamViec: string | null
  maChungChiHanhNghe: string | null
  moTaBanThan: string | null
  trangThaiHoSo: string | null
}

export type DoctorProfile = {
  maBacSi: number
  maTaiKhoan: number
  maNguoiDung: number
  tenDangNhap: string
  vaiTro: string
  trangThaiTaiKhoan: string
  hoLot: string
  ten: string
  hoTenDayDu: string
  soDienThoai: string
  email: string
  anhDaiDien: string | null
  chuyenKhoa: string
  trinhDoChuyenMon: string
  loaiHinhBacSi: string
  tenCoSoYTe: string
  diaChiLamViec: string | null
  maChungChiHanhNghe: string
  moTaBanThan: string | null
  trangThaiHoSo: string
}

export type DoctorImageSearchResult = {
  bacSi: DoctorProfile
  similarityScore: number
  matchedImageUrl: string
}

export type FollowedDoctor = {
  maNguoiDung: number
  maBacSi: number
  hoTenBacSi: string
  chuyenKhoa: string
  tenCoSoYTe: string
  diaChiLamViec: string | null
  anhDaiDienBacSi: string | null
  ngayTheoDoi: string
}

export type FollowActionResponse = {
  success: boolean
  message: string
  maNguoiDung: number
  maBacSi: number
  followed: boolean
  ngayTheoDoi: string
}

export type ConversationSummary = {
  maCuocHoiThoai: number
  maNguoiDung: number
  hoTenBenhNhan: string
  anhDaiDienBenhNhan: string | null
  maBacSi: number
  hoTenBacSi: string
  anhDaiDienBacSi: string | null
  chuyenKhoa: string
  tenCoSoYTe: string
  diaChiLamViec: string | null
  ngayTao: string
  maTinNhanCuoi: number | null
  maTaiKhoanGuiCuoi: number | null
  loaiNoiDungCuoi: string | null
  noiDungCuoi: string | null
  thoiGianGuiCuoi: string | null
}

export type Message = {
  maTinNhan: number
  maCuocHoiThoai: number
  maTaiKhoanGui: number
  loaiNoiDung: string
  noiDungTinNhan: string
  thoiGianGui: string
}

export type WorkingSlot = {
  maChiTiet: number
  maLichLamViec: number
  maBacSi: number
  thuTrongTuan: number | null
  ngayCuThe: string | null
  gioBatDau: string
  gioKetThuc: string
  trangThai: string
  khoaDen: string | null
  maPhieuDatLichHienTai: number | null
  maKhungGio: number
  thoiLuongPhut: number
  trangThaiLich: string
}

export type TimeSlot = {
  maKhungGio: number
  thoiLuongPhut: number
}

export type WorkingScheduleSlot = {
  maChiTiet: number
  gioBatDau: string
  gioKetThuc: string
  trangThai: string
  khoaDen: string | null
  maPhieuDatLichHienTai: number | null
}

export type WorkingSchedule = {
  maLichLamViec: number
  maBacSi: number
  thuTrongTuan: number | null
  ngayCuThe: string | null
  gioBatDau: string
  gioKetThuc: string
  maKhungGio: number
  thoiLuongPhut: number
  soLuongToiDa: number
  trangThaiLich: string
  chiTiet: WorkingScheduleSlot[]
}

export type AppointmentSummary = {
  maPhieuDatLich: number
  maNguoiDung: number
  maBacSi: number
  maChiTiet: number
  loaiPhieu: string
  trieuChungGhiChu: string | null
  trangThaiPhieu: string
  lyDoTuChoi: string | null
  coTheDanhGia: boolean
  ngayCuThe: string | null
  thuTrongTuan: number | null
  gioBatDau: string
  gioKetThuc: string
  hoTenBacSi: string
  chuyenKhoa: string
  tenCoSoYTe: string
  diaChiLamViec: string | null
}

export type AppointmentDetail = {
  maPhieuDatLich: number
  trangThaiPhieu: string
  lyDoTuChoi: string | null
  loaiPhieu: string
  trieuChungGhiChu: string | null
  maNguoiDung: number
  hoTenBenhNhan: string
  soDienThoaiBenhNhan: string
  emailBenhNhan: string
  maBacSi: number
  hoTenBacSi: string
  chuyenKhoa: string
  tenCoSoYTe: string
  diaChiLamViec: string | null
  ngayCuThe: string | null
  thuTrongTuan: number | null
  gioBatDau: string
  gioKetThuc: string
  maChiTiet: number
  maLichLamViec: number
  maKhungGio: number
  thoiLuongPhut: number
  trangThaiLich: string
  coTheDanhGia: boolean
}

export type AppointmentRequest = {
  maPhieuDatLich: number
  maNguoiDung: number
  maChiTiet: number
  hoTenBenhNhan: string
  soDienThoaiBenhNhan: string
  emailBenhNhan: string
  ngayCuThe: string | null
  thuTrongTuan: number | null
  gioBatDau: string
  gioKetThuc: string
  loaiPhieu: string
  trieuChungGhiChu: string | null
  trangThaiPhieu: string
}

export type CreateReviewRequest = {
  maNguoiDung: number
  maBacSi: number
  soSao: number
  noiDung: string | null
}

export type CreateReviewResponse = Review

export type UpgradeToDoctorResponse = {
  upgraded: boolean
  message: string
  maTaiKhoan: number
  maBacSi: number
  trangThaiHoSo: string
  soTaiLieuDaTaiLen: number
}

export type Review = {
  maDanhGia: number
  maNguoiDung: number
  hoTenNguoiDung: string
  anhDaiDienNguoiDung: string | null
  maBacSi: number
  soSao: number
  noiDung: string | null
  thoiGian: string
}

export type RatingSummary = {
  maBacSi: number
  tongDanhGia: number
  soSaoTrungBinh: number | null
}

export type DoctorDocument = {
  maTaiLieu: number
  maBacSi: number
  tieuDeTaiLieu: string
  duongDanFileUrl: string
}

export type PendingDoctorProfile = {
  maBacSi: number
  maTaiKhoan: number
  maNguoiDung: number
  hoTenDayDu: string
  soDienThoai: string
  email: string
  chuyenKhoa: string
  maChungChiHanhNghe: string
  trangThaiHoSo: string
  soLuongTaiLieu: number
}

export type AdminDoctorDetail = {
  maBacSi: number
  maTaiKhoan: number
  maNguoiDung: number
  hoLot: string
  ten: string
  hoTenDayDu: string
  soDienThoai: string
  email: string
  cccd: string
  anhDaiDien: string | null
  chuyenKhoa: string
  trinhDoChuyenMon: string
  loaiHinhBacSi: string
  tenCoSoYTe: string
  diaChiLamViec: string | null
  maChungChiHanhNghe: string
  moTaBanThan: string | null
  trangThaiHoSo: string
  documents: DoctorDocument[]
}

export type AdminDoctorAction = {
  success: boolean
  message: string
  maBacSi: number
  trangThaiHoSo: string
  lyDoTuChoi: string | null
}

export type AdminAccount = {
  maTaiKhoan: number
  tenDangNhap: string
  vaiTro: string
  trangThaiHoatDong: string
  ngayTao: string
  maNguoiDung: number | null
  hoTenNguoiDung: string | null
  soDienThoai: string | null
  email: string | null
  maBacSi: number | null
  trangThaiHoSoBacSi: string | null
}

export type AdminAccountAction = {
  success: boolean
  message: string
  maTaiKhoan: number
  tenDangNhap: string
  vaiTro: string
  trangThaiHoatDong: string
  ngayTao: string
}

/** Admin dashboard & báo cáo tìm kiếm / lượt xem hồ sơ bác sĩ */
export type AdminDashboardOverview = {
  onlineAccounts: number
  totalMembers: number
  totalDoctors: number
  onlineWindowMinutes: number
}

export type AdminDashboardEvent = {
  type: string
  message: string
  occurredAt: string
}

export type AdminReportSlice = {
  label: string
  value: number
  percent: number
}

export type AdminDoctorProfileTrafficReport = {
  slices: AdminReportSlice[]
  totalViews: number
}

export type AdminReportDoctorRank = {
  rank: number
  maBacSi: number
  hoTenDayDu: string
  count: number
}

export type AdminReportKeyword = {
  rank: number
  keyword: string
  count: number
}
