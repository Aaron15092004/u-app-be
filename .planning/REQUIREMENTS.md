# Requirements — Ủ App

## v1 Requirements

### AUTH — Authentication & Onboarding

- [ ] **AUTH-01**: User xem 3 màn onboarding (Welcome / Daily tracking / Get started) khi lần đầu mở app
- [ ] **AUTH-02**: User đăng ký tài khoản bằng email + password (tối thiểu 8 ký tự, xác nhận mật khẩu, đồng ý Terms)
- [ ] **AUTH-03**: User đăng nhập bằng email + password
- [ ] **AUTH-04**: User reset mật khẩu qua link email
- [ ] **AUTH-05**: User đăng nhập / đăng ký bằng Google OAuth
- [ ] **AUTH-06**: User đăng nhập / đăng ký bằng Apple Sign In
- [ ] **AUTH-07**: User ở trạng thái đăng nhập xuyên suốt giữa các session (JWT refresh token)
- [ ] **AUTH-08**: User đăng xuất khỏi app

### HOME — Dashboard

- [ ] **HOME-01**: Home hiển thị lời chào theo tên user và thông báo bell icon
- [ ] **HOME-02**: Home hiển thị tổng quan hôm nay: tổng kcal tiêu thụ, số ly nước, số phút tập
- [ ] **HOME-03**: Home có quick actions: Quét bữa ăn, Bắt đầu tập, Thói quen
- [ ] **HOME-04**: Home hiển thị BMI widget (chỉ số + phân loại)
- [ ] **HOME-05**: Home hiển thị Nutrition summary hôm nay (Calo/Protein/Carbs/Chất béo với progress bar)
- [ ] **HOME-06**: Home hiển thị Ủ Shop banner (tap mở external link / webview)

### FOOD — Bữa ăn & Dinh dưỡng

- [ ] **FOOD-01**: User chụp ảnh bữa ăn bằng camera để phân tích dinh dưỡng bằng AI
- [ ] **FOOD-02**: User chọn ảnh từ thư viện điện thoại để phân tích
- [ ] **FOOD-03**: App hiển thị màn camera scan với scan frame, nút chụp, gallery, flash (dark theme — theo mockup)
- [ ] **FOOD-04**: Sau khi phân tích AI, app hiển thị: tên món ăn + tags (rau xanh, cà rốt...), tổng kcal, Protein/Carbs/Chất béo, Chất xơ/Đường/Natri/Vitamin C
- [ ] **FOOD-05**: User xác nhận kết quả AI và lưu bữa ăn vào nhật ký ("Xác nhận & Lưu")
- [ ] **FOOD-06**: User chụp lại nếu kết quả không chính xác ("Chụp lại")
- [ ] **FOOD-07**: User tìm kiếm món ăn thủ công trong database
- [ ] **FOOD-08**: App có database thực phẩm Việt Nam (200-500 món seed sẵn) + Open Food Facts API cho barcode scan
- [ ] **FOOD-09**: User xem nhật ký bữa ăn theo ngày (lịch sử)

### WORKOUT — Tập luyện

- [ ] **WO-01**: User xem danh sách bài tập với filter theo category: Tất cả / Yoga / Cardio / Tạ / Giãn cơ
- [ ] **WO-02**: Mỗi bài tập hiển thị: tên, hình ảnh, độ khó (Dễ/Trung bình/Khó), thời gian (phút), kcal
- [ ] **WO-03**: User xem thống kê tuần: tổng ngày hoàn thành / 7, tổng bài tập, tổng kcal đốt, tổng phút
- [ ] **WO-04**: User xem daily challenge (đốt X calo) với progress bar
- [ ] **WO-05**: User xem chi tiết bài tập: mô tả, danh sách động tác (tên + số phút), lưu ý
- [ ] **WO-06**: User bắt đầu tập luyện từ màn chi tiết
- [ ] **WO-07**: App hiển thị countdown timer (thời gian còn lại) với tên bài tập (orange theme — theo mockup)
- [ ] **WO-08**: User có thể pause, dừng, hoặc hoàn thành bài tập trong lúc tập
- [ ] **WO-09**: Sau khi hoàn thành, app hiển thị màn "Xuất sắc!" với nút Hoàn tất (orange theme — theo mockup)
- [ ] **WO-10**: Bài tập được lưu vào lịch sử workout của user
- [ ] **WO-11**: App có sẵn 100+ bài tập từ launch (seed data trong 4 categories)

### HABIT — Thói quen

- [ ] **HAB-01**: User xem danh sách thói quen hàng ngày với progress (X/6 hoàn thành, %)
- [ ] **HAB-02**: App có sẵn 6 thói quen mặc định: Uống 8 ly nước, Ăn 5 bữa rau củ, Tập luyện 30 phút, Ngủ đủ 8 tiếng, Đọc sách 20 phút, Uống sữa hạt
- [ ] **HAB-03**: User đánh dấu hoàn thành từng thói quen ("Đánh dấu +1")
- [ ] **HAB-04**: App hiển thị streak counter (chuỗi ngày liên tiếp)
- [ ] **HAB-05**: App hiển thị heatmap tuần (T2-T3-T4-T5-T6-T7-CN) để theo dõi consistency
- [ ] **HAB-06**: App hiển thị tips section về habit building
- [ ] **HAB-07**: Tiến độ thói quen hàng ngày được reset lúc 00:00

### BMI — Chỉ số cơ thể

- [ ] **BMI-01**: User xem màn Phân tích BMI với chỉ số hiện tại + phân loại (Thiếu cân/Bình thường/Thừa cân/Béo phì)
- [ ] **BMI-02**: App hiển thị BMI scale bar (15–40) với vị trí điểm hiện tại
- [ ] **BMI-03**: User cập nhật chiều cao và cân nặng qua slider
- [ ] **BMI-04**: App tự động tính và cập nhật BMI khi thay đổi chiều cao/cân nặng
- [ ] **BMI-05**: App hiển thị lời khuyên sức khỏe dựa trên BMI (ví dụ: "Duy trì thói quen tốt")
- [ ] **BMI-06**: App hiển thị lịch sử BMI 30 ngày qua bar chart

### PROFILE — Hồ sơ cá nhân

- [ ] **PRO-01**: User xem hồ sơ với: avatar, tên, email
- [ ] **PRO-02**: User xem thống kê cá nhân: Ngày streak, số Bài tập, tổng Calo đốt
- [ ] **PRO-03**: User xem và cập nhật thông tin: email, tuổi, chiều cao, cân nặng, mục tiêu sức khỏe
- [ ] **PRO-04**: App hiển thị thành tích "Người kiên trì" với các mốc 7/14/28/60 ngày
- [ ] **PRO-05**: User vào cài đặt thông báo (on/off)
- [ ] **PRO-06**: User vào Trợ giúp & Hỗ trợ
- [ ] **PRO-07**: User đăng xuất từ màn Profile

### NOTIF — Push Notifications

- [ ] **NOTIF-01**: App hiển thị rationale screen giải thích lý do trước khi xin permission push notification
- [ ] **NOTIF-02**: App gửi reminder uống nước hàng ngày (theo giờ cài đặt)
- [ ] **NOTIF-03**: App gửi reminder bắt đầu tập luyện (theo giờ cài đặt)
- [ ] **NOTIF-04**: App gửi streak alert khi user sắp mất streak

### ADMIN — Web Dashboard

- [ ] **ADM-01**: Admin đăng nhập web dashboard bằng email/password
- [ ] **ADM-02**: Admin xem, tạo, sửa, xóa bài tập (tên, category, độ khó, thời gian, kcal, hình ảnh, danh sách động tác)
- [ ] **ADM-03**: Admin xem, tạo, sửa, xóa thực phẩm trong database (tên, kcal, macros, micros)
- [ ] **ADM-04**: Admin xem danh sách users (email, ngày đăng ký, trạng thái)

---

## v2 Requirements (Deferred)

- Social features (follow users, share progress, leaderboard)
- Custom habit creation (user tạo thói quen riêng)
- Recipe builder
- AI chat coach
- Wearable integration (Apple Watch, Garmin)
- Video workout content
- Barcode scan mở rộng (Open Food Facts integration in v1 giới hạn packaged goods)
- Progress photo comparison
- Diet plan / meal plan generation
- Zalo integration
- Multi-language (English)
- HealthKit / Google Fit sync

---

## Out of Scope (v1)

- E-commerce / checkout trong app — Ủ Shop chỉ là redirect link
- Real-time social feed — tăng complexity đáng kể
- Video exercise content — cần CDN + storage phức tạp
- Custom habit creation — 6 habit defaults đủ cho v1 validation
- Barcode scan phần cứng (chỉ dùng Open Food Facts API cho text search đóng hộp) — barcode camera scanner để v2
- Wearable sync — requires separate SDK + permissions
- Web app cho end users — mobile only v1

---

## Traceability

| REQ-ID | Phase | Status |
| ------ | ----- | ------ |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| AUTH-08 | Phase 2 | Pending |
| HOME-01 | Phase 5 | Pending |
| HOME-02 | Phase 5 | Pending |
| HOME-03 | Phase 5 | Pending |
| HOME-04 | Phase 5 | Pending |
| HOME-05 | Phase 5 | Pending |
| HOME-06 | Phase 5 | Pending |
| FOOD-01 | Phase 4 | Pending |
| FOOD-02 | Phase 4 | Pending |
| FOOD-03 | Phase 4 | Pending |
| FOOD-04 | Phase 4 | Pending |
| FOOD-05 | Phase 4 | Pending |
| FOOD-06 | Phase 4 | Pending |
| FOOD-07 | Phase 4 | Pending |
| FOOD-08 | Phase 4 | Pending |
| FOOD-09 | Phase 4 | Pending |
| WO-01 | Phase 3 | Pending |
| WO-02 | Phase 3 | Pending |
| WO-03 | Phase 3 | Pending |
| WO-04 | Phase 3 | Pending |
| WO-05 | Phase 3 | Pending |
| WO-06 | Phase 3 | Pending |
| WO-07 | Phase 3 | Pending |
| WO-08 | Phase 3 | Pending |
| WO-09 | Phase 3 | Pending |
| WO-10 | Phase 3 | Pending |
| WO-11 | Phase 3 | Pending |
| HAB-01 | Phase 3 | Pending |
| HAB-02 | Phase 3 | Pending |
| HAB-03 | Phase 3 | Pending |
| HAB-04 | Phase 3 | Pending |
| HAB-05 | Phase 3 | Pending |
| HAB-06 | Phase 3 | Pending |
| HAB-07 | Phase 3 | Pending |
| BMI-01 | Phase 3 | Pending |
| BMI-02 | Phase 3 | Pending |
| BMI-03 | Phase 3 | Pending |
| BMI-04 | Phase 3 | Pending |
| BMI-05 | Phase 3 | Pending |
| BMI-06 | Phase 3 | Pending |
| PRO-01 | Phase 5 | Pending |
| PRO-02 | Phase 5 | Pending |
| PRO-03 | Phase 5 | Pending |
| PRO-04 | Phase 5 | Pending |
| PRO-05 | Phase 5 | Pending |
| PRO-06 | Phase 5 | Pending |
| PRO-07 | Phase 5 | Pending |
| NOTIF-01 | Phase 5 | Pending |
| NOTIF-02 | Phase 5 | Pending |
| NOTIF-03 | Phase 5 | Pending |
| NOTIF-04 | Phase 5 | Pending |
| ADM-01 | Phase 6 | Pending |
| ADM-02 | Phase 6 | Pending |
| ADM-03 | Phase 6 | Pending |
| ADM-04 | Phase 6 | Pending |

<!-- Total: 62/62 v1 requirements mapped -->

---

*Created: 2026-05-17 — based on Figma mockup analysis + domain research*
*Traceability updated: 2026-05-17 — roadmap finalized (6 phases)*
