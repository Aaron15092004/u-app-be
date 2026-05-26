# Phase 2: Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 2-authentication
**Areas discussed:** Email service (password reset), Profile data tại registration, Onboarding skip behavior, Cold start auth UX

---

## Email Service (Password Reset)

| Option | Description | Selected |
|--------|-------------|----------|
| Resend | Modern email API, free tier 3000 emails/month, developer-friendly SDK | ✓ |
| Nodemailer + Gmail SMTP | Không trả phí nhưng Gmail SMTP giới hạn 500/ngày, OEM Android hay block | |
| SendGrid | 100 emails/ngày free, API vững chắc nhưng bảng điều khiển phức tạp hơn | |

**User's choice:** Resend

---

| Option | Description | Selected |
|--------|-------------|----------|
| 15 phút | Bảo mật cao nhất, user phải kiểm tra email ngay | |
| 1 giờ | Cân bằng giữa bảo mật và UX | ✓ |
| 24 giờ | Thuận tiện nhất nhưng link tồn tại lâu hơn | |

**User's choice:** 1 giờ

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tiếng Việt | 100% phù hợp target users Việt Nam | ✓ |
| Song ngữ Việt + Anh | Tăng compatibility nhưng phức tạp hơn, không phù hợp v1 Vietnam only | |

**User's choice:** Tiếng Việt

---

| Option | Description | Selected |
|--------|-------------|----------|
| Không | User vào app ngay sau đăng ký — giảm friction | ✓ |
| Có — bắt buộc xác thực trước khi vào app | Tăng chất lượng user base nhưng thêm friction và handle unverified state | |

**User's choice:** Không gửi email verification

---

## Profile Data tại Registration

| Option | Description | Selected |
|--------|-------------|----------|
| Vào thẳng main app | Giảm friction. Height/weight để user điền sau từ Profile/BMI screen | |
| Màn 'Hoàn thiện hồ sơ' trước khi vào app | Thu thập dữ liệu cần thiết trước. BMI Phase 3 có data ngay lập tức | ✓ |

**User's choice:** Màn "Hoàn thiện hồ sơ" bắt buộc sau signup/OAuth

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tên + chiều cao + cân nặng | Tối thiểu để BMI hoạt động ngay | |
| Tên + tuổi + chiều cao + cân nặng + mục tiêu sức khỏe | Thu thập đủ thông tin cho personalization, vẫn 1 màn | ✓ |
| Chỉ tên | Minimum để User model hợp lệ | |

**User's choice:** Tên + tuổi + chiều cao + cân nặng + mục tiêu sức khỏe

---

| Option | Description | Selected |
|--------|-------------|----------|
| Không — để tên đến màn 'Hoàn thiện hồ sơ' | Form đăng ký chỉ: email + password + confirm + Terms. Đơn giản như Figma mockup | ✓ |
| Có — thêm trường Tên vào form đăng ký | Tên được thu thập ngay tại đăng ký | |

**User's choice:** Không — tên thu thập tại màn profile setup

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bắt buộc — không có nút skip | User model yêu cầu name. BMI cần height/weight | ✓ |
| Tùy chọn — có nút 'Bỏ qua' vào sau | Giảm friction nhưng cần handle null profile | |

**User's choice:** Bắt buộc, không có nút skip

---

## Onboarding Skip Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| MMKV flag `onboarding_seen` | Lưu local, nhanh, dùng react-native-mmkv đã có sẵn từ Phase 1 | ✓ |
| Kiểm tra JWT token trong expo-secure-store | Logic bị sai khi user đăng xuất | |

**User's choice:** MMKV flag `onboarding_seen`

---

| Option | Description | Selected |
|--------|-------------|----------|
| Đăng nhập (Login screen) | User bỏ qua = có thể đã có tài khoản | |
| Đăng ký (Register screen) | Giả định user mới | |
| *(Freeform response)* | Xóa nút Bỏ qua đi — không dùng nút bỏ qua nữa, user bắt buộc tiếp tục | ✓ |

**User's choice:** Xóa nút "Bỏ qua" hoàn toàn — 3 màn onboarding là bắt buộc
**Notes:** User không muốn skip button. Tất cả 3 màn phải được xem qua. Điều hướng: "Tiếp tục" (Screen 1-2), "Bắt đầu" (Screen 3).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Đăng nhập (Login screen) | User có thể đăng nhập hoặc tap "Chưa có tài khoản? Đăng ký" | ✓ |
| Màn chọn: Đăng ký / Đăng nhập | Hiển thị 2 nút rõ ràng nhưng thêm 1 extra screen | |

**User's choice:** Screen 3 "Bắt đầu" → Login screen

---

## Cold Start Auth UX

| Option | Description | Selected |
|--------|-------------|----------|
| Splash screen giữ nguyên đến khi refresh xong | Expo `SplashScreen.preventAutoHideAsync()`. Không có flash login screen | ✓ |
| Spinner trên nền trắng | App render ngay, hiển thị loading state. Có flash trước khi redirect | |
| Hiển thị Login ngay, redirect sau | User thấy Login 1-2 giây rồi bị redirect. Tạo cảm giác giật cục | |

**User's choice:** Splash screen giữ nguyên đến khi auth state resolved

---

| Option | Description | Selected |
|--------|-------------|----------|
| Login screen + thông báo | Toast: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." Xóa token cũ | ✓ |
| Login screen, không thông báo | Im lặng redirect. User không hiểu tại sao bị đẩy ra | |

**User's choice:** Login screen + toast notification khi token hết hạn

---

| Option | Description | Selected |
|--------|-------------|----------|
| Xóa JWT tokens + reset Zustand store | Xóa SecureStore + clear Zustand + queryClient.clear(). Giữ onboarding flag | ✓ |
| Xóa toàn bộ (bao gồm onboarding flag) | Reset total. User thấy onboarding lại | |

**User's choice:** Xóa JWT tokens + reset Zustand store, giữ `onboarding_seen`

---

## Claude's Discretion

- Không có items — tất cả các lựa chọn đều được user quyết định trực tiếp.

## Deferred Ideas

- **Social login khác (Facebook, Zalo)** — v2. Figma chỉ có Google + Apple.
- **Biometric authentication (Face ID / Touch ID)** — `expo-local-authentication`. Để Phase 5 hoặc v2.
- **Multi-device session management** — Quản lý danh sách thiết bị, revoke remote. v2.
- **Account deletion** — User tự xóa tài khoản. v2.
