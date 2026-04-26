# PHÂN CÔNG UI — NHÓM DOCTOR (Lần 1)

## 1) Danh sách page cần làm (kèm file & route)

| Nhóm | Page | Route | File |
|---|---|---|---|
| Doctor | Dashboard bác sĩ | `/doctor/home` | `src/pages/doctor/DoctorHomePage.tsx` |
| Doctor | Kênh làm việc | `/doctor/workspace` | `src/pages/doctor/DoctorWorkspacePage.tsx` |
| Doctor | Yêu cầu đặt lịch | `/doctor/requests` | `src/pages/doctor/DoctorRequestsPage.tsx` |
| Doctor | Lịch làm việc | `/doctor/schedule` | `src/pages/doctor/DoctorSchedulePage.tsx` |
| Doctor | Minh chứng | `/doctor/documents` | `src/pages/doctor/DoctorDocumentsPage.tsx` |
| Doctor | Tin nhắn | `/doctor/messages` | `src/pages/member/MessagesPage.tsx` |
| Doctor | Chat | `/doctor/messages/:maCuocHoiThoai` | `src/pages/member/ChatPage.tsx` |
| Doctor | Tài khoản | `/doctor/account` | `src/pages/member/AccountPage.tsx` |

> **Lưu ý**: Không làm phần admin theo yêu cầu.

---

## 2) Hướng dẫn chi tiết theo page

### A. DoctorHomePage (`/doctor/home`)
**Mục đích:** Dashboard tổng quan + điều hướng nhanh.  
**Kết quả mong muốn:** Bác sĩ thấy ngay trạng thái hồ sơ và các CTA chính.  
**Gợi ý UI:** Card tóm tắt hồ sơ + badge trạng thái + 3 CTA (Duyệt lịch, Lịch làm việc, Minh chứng).

---

### B. DoctorWorkspacePage (`/doctor/workspace`)
**Mục đích:** “Kênh làm việc” tổng hợp hồ sơ + lịch + chứng chỉ.  
**Kết quả mong muốn:** Bác sĩ hiểu nhanh các khu vực cần thao tác.  
**Gợi ý UI:** Tóm tắt hồ sơ, các nút điều hướng (Lịch, Minh chứng, Duyệt lịch, Hồ sơ cá nhân).

---

### C. DoctorRequestsPage (`/doctor/requests`)
**Mục đích:** Duyệt yêu cầu đặt lịch (đồng ý/từ chối).  
**Kết quả mong muốn:** Danh sách dễ đọc, thao tác duyệt nhanh.  
**Gợi ý UI:** Card per request + info bệnh nhân + giờ khám + CTA duyệt/từ chối.

---

### D. DoctorSchedulePage (`/doctor/schedule`)
**Mục đích:** Quản lý lịch làm việc và khung giờ.  
**Kết quả mong muốn:** Thêm/sửa lịch đơn giản, hiển thị slot rõ trạng thái.  
**Gợi ý UI:** Form tạo lịch + list slot theo ngày.

---

### E. DoctorDocumentsPage (`/doctor/documents`)
**Mục đích:** Quản lý minh chứng (upload/xóa).  
**Kết quả mong muốn:** Upload dễ, hiển thị link file rõ ràng.  
**Gợi ý UI:** Upload box + list tài liệu với CTA “Xóa/Mở”.

---

### F. MessagesPage (`/doctor/messages`)
**Mục đích:** Danh sách hội thoại.  
**Kết quả mong muốn:** Hiển thị preview tin nhắn cuối + thời gian.  
**Gợi ý UI:** List item có avatar + badge unread (nếu có).

---

### G. ChatPage (`/doctor/messages/:maCuocHoiThoai`)
**Mục đích:** Chat bác sĩ–bệnh nhân.  
**Kết quả mong muốn:** Chat mượt, bubble rõ ràng, input cố định dưới.  
**Gợi ý UI:** Timeline bubble, input toolbar, trạng thái lỗi/đang gửi.

---

### H. AccountPage (`/doctor/account`)
**Mục đích:** Xem/cập nhật hồ sơ cá nhân + hồ sơ bác sĩ.  
**Kết quả mong muốn:** Form rõ ràng, trạng thái hồ sơ bác sĩ hiển thị.  
**Gợi ý UI:** Chia 2 section (User / Doctor), CTA lưu.

---

## 3) Checklist chung khi làm UI
- Hiển thị đủ **loading / error / empty** state.
- Dùng cùng style (card, chip, button).
- Text tiếng Việt, dễ đọc khi preview.
