# PHÂN CÔNG UI — NHÓM MEMBER (Lần 1)

## 1) Danh sách page cần làm (kèm file & route)

| Nhóm | Page | Route | File |
|---|---|---|---|
| Landing | Trang chủ | `/` | `src/pages/LandingPage.tsx` |
| Auth | Đăng nhập | `/login` | `src/pages/LoginPage.tsx` |
| Auth | Đăng ký (User/Doctor + OTP) | `/register` | `src/pages/RegisterPage.tsx` |
| Member | Trang chính (tìm bác sĩ) | `/app/home` | `src/pages/member/HomePage.tsx` |
| Member | Hồ sơ bác sĩ | `/app/doctors/:maBacSi` | `src/pages/member/DoctorDetailPage.tsx` |
| Member | Lịch làm việc bác sĩ (chọn slot) | `/app/doctors/:maBacSi/slots` | `src/pages/member/WorkingSlotsPage.tsx` |
| Member | Danh sách phiếu đặt lịch | `/app/appointments` | `src/pages/member/AppointmentsPage.tsx` |
| Member | Chi tiết phiếu | `/app/appointments/:maPhieuDatLich` | `src/pages/member/AppointmentDetailPage.tsx` |
| Member | Chọn bác sĩ đã biết | `/app/appointments/new/known` | `src/pages/member/ChooseKnownDoctorPage.tsx` |
| Member | Theo dõi bác sĩ | `/app/follows` | `src/pages/member/FollowsPage.tsx` |
| Member | Danh sách hội thoại | `/app/messages` | `src/pages/member/MessagesPage.tsx` |
| Member | Chat | `/app/messages/:maCuocHoiThoai` | `src/pages/member/ChatPage.tsx` |
| Member | Tài khoản | `/app/account` | `src/pages/member/AccountPage.tsx` |
| Member | Trạng thái hồ sơ bác sĩ | `/app/doctor-status` | `src/pages/member/DoctorStatusPage.tsx` |
| Member | Bác sĩ vừa xem | `/app/doctors/recent` | `src/pages/member/RecentDoctorsPage.tsx` |
| Member | Bác sĩ gợi ý | `/app/doctors/suggested` | `src/pages/member/SuggestedDoctorsPage.tsx` |

> **Lưu ý**: Không làm phần admin theo yêu cầu.

---

## 2) Hướng dẫn chi tiết theo page

### A. LandingPage (`/`)
**Mục đích:** Giới thiệu hệ thống, CTA rõ ràng “Đăng nhập/Đăng ký”.  
**Kết quả mong muốn:** Người dùng hiểu nhanh sản phẩm và có đường vào đăng ký/đăng nhập.  
**Gợi ý UI:** hero banner + 2 CTA, mô tả tính năng ngắn (tìm bác sĩ, đặt lịch, nhắn tin).

---

### B. LoginPage (`/login`)
**Mục đích:** Đăng nhập tài khoản (email/SĐT + mật khẩu).  
**Kết quả mong muốn:** Form gọn, validation rõ, thông báo lỗi/đang tải đẹp.  
**Gợi ý UI:** Form card, trạng thái loading, link “Đăng ký”.

---

### C. RegisterPage (`/register`)
**Mục đích:** Đăng ký user hoặc đăng ký kèm bác sĩ + OTP.  
**Kết quả mong muốn:** Flow 3 bước rõ ràng (User Info → Doctor Info → OTP).  
**Gợi ý UI:** Stepper, trạng thái lỗi theo field, upload minh chứng, CTA “Gửi OTP / Xác thực”.

---

### D. HomePage (`/app/home`)
**Mục đích:** Dashboard member + tìm bác sĩ (text & image).  
**Kết quả mong muốn:** Tìm kiếm nhanh + hiển thị danh sách bác sĩ.  
**Gợi ý UI:** Tab chuyển mode Text/Image, list card bác sĩ, quick links tới “Vừa xem/Gợi ý”.

---

### E. DoctorDetailPage (`/app/doctors/:maBacSi`)
**Mục đích:** Xem hồ sơ bác sĩ + CTA đặt lịch/nhắn tin/theo dõi.  
**Kết quả mong muốn:** Thông tin rõ, rating, mô tả, nút hành động nổi bật.  
**Gợi ý UI:** Header info, rating summary, list review, CTA sticky.

---

### F. WorkingSlotsPage (`/app/doctors/:maBacSi/slots`)
**Mục đích:** Chọn ngày và khung giờ khám.  
**Kết quả mong muốn:** Chọn slot dễ, trạng thái slot rõ (trống/giữ/đã đặt).  
**Gợi ý UI:** Date picker, grid slot, CTA “Gửi yêu cầu”.

---

### G. AppointmentsPage (`/app/appointments`)
**Mục đích:** Danh sách phiếu đặt lịch (Sắp tới/Lịch sử).  
**Kết quả mong muốn:** Badge trạng thái + lọc tab + mở chi tiết.  
**Gợi ý UI:** Tabs, card list, icon “+” tạo phiếu mới.

---

### H. AppointmentDetailPage (`/app/appointments/:maPhieuDatLich`)
**Mục đích:** Xem chi tiết phiếu + hủy/đánh giá.  
**Kết quả mong muốn:** Thông tin lịch rõ ràng, trạng thái, lý do từ chối.  
**Gợi ý UI:** Section thông tin, CTA hủy, form đánh giá (rating + comment).

---

### I. ChooseKnownDoctorPage (`/app/appointments/new/known`)
**Mục đích:** Chọn bác sĩ đã biết (lịch sử / theo dõi).  
**Kết quả mong muốn:** Chọn nhanh từ 2 nguồn.  
**Gợi ý UI:** Tabs “Lịch sử / Theo dõi”, list card + nút “Chọn”.

---

### J. FollowsPage (`/app/follows`)
**Mục đích:** Xem & quản lý danh sách theo dõi.  
**Kết quả mong muốn:** Dễ bỏ theo dõi / vào hồ sơ bác sĩ.  
**Gợi ý UI:** Card list, nút “Bỏ theo dõi”, empty state rõ.

---

### K. MessagesPage (`/app/messages`)
**Mục đích:** Danh sách hội thoại.  
**Kết quả mong muốn:** Hiển thị preview tin nhắn cuối + thời gian.  
**Gợi ý UI:** List item, avatar, chip unread (nếu có).

---

### L. ChatPage (`/app/messages/:maCuocHoiThoai`)
**Mục đích:** Chat giữa user–doctor.  
**Kết quả mong muốn:** Lịch sử rõ ràng, gửi tin nhắn ổn định.  
**Gợi ý UI:** Bubble chat, input fixed bottom, trạng thái lỗi.

---

### M. AccountPage (`/app/account`)
**Mục đích:** Hồ sơ cá nhân + nâng cấp hồ sơ bác sĩ.  
**Kết quả mong muốn:** Sửa thông tin user + upload minh chứng + gửi yêu cầu.  
**Gợi ý UI:** Form chia block, CTA “Lưu hồ sơ”, CTA “Mở hồ sơ bác sĩ”.

---

### N. DoctorStatusPage (`/app/doctor-status`)
**Mục đích:** Xem trạng thái hồ sơ bác sĩ (chờ duyệt/đã duyệt/từ chối).  
**Kết quả mong muốn:** Trạng thái hiển thị rõ, có link về Account.  
**Gợi ý UI:** Status badge lớn + mô tả ngắn.

---

### O. RecentDoctorsPage (`/app/doctors/recent`)
**Mục đích:** Danh sách bác sĩ vừa xem.  
**Kết quả mong muốn:** Xem lại nhanh + nút xóa lịch sử.  
**Gợi ý UI:** List card + nút “Xóa lịch sử”.

---

### P. SuggestedDoctorsPage (`/app/doctors/suggested`)
**Mục đích:** Gợi ý bác sĩ nổi bật (từ search).  
**Kết quả mong muốn:** Danh sách gợi ý có CTA vào hồ sơ.  
**Gợi ý UI:** Card list, button “Xem”.

---

## 3) Checklist chung khi làm UI
- Hiển thị đủ **loading / error / empty** state.
- Dùng cùng style (card, chip, button).
- Text tiếng Việt, dễ đọc khi preview.
