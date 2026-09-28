# ☕ Buy Me a Coffee VN — Nền Tảng Ủng Hộ Sáng Tạo Song Ngữ Tự Động Hóa 100%

Dự án website **Buy Me a Coffee** phong cách hiện đại, tối giản, hỗ trợ song ngữ Việt – Anh, tích hợp **VietQR** tạo mã QR động ngân hàng và tự động xác nhận thanh toán tức thì qua **SePay Webhook** (VND) và **Tip4Serv** (Quốc tế).

Hệ thống hoạt động **Serverless hoàn toàn miễn phí 0đ tiền máy chủ**:
- **Frontend:** React + Tailwind CSS + Lucide Icons + Be Vietnam Pro Font.
- **Backend:** Google Apps Script Web App.
- **Database:** Google Sheets (chống trùng lặp và race condition với `LockService`).
- **Hosting:** GitHub Pages (tự động triển khai qua GitHub Actions CI/CD).
- **Admin Authentication:** GitHub OAuth & Mã bí mật.

---

## 🚀 Các Tính Năng Nổi Bật

1. **Giao diện hiện đại & Tối giản:**
   - Hỗ trợ đầy đủ **Light Mode** và **Dark Mode**.
   - Phông chữ **Be Vietnam Pro** hiển thị mượt mà tiếng Việt có dấu.
   - Thước đo mục tiêu cộng đồng (Goal Progress Bar).
   - Tường người ủng hộ vinh danh các nhà tài trợ với thời gian thực.
   - Tùy chọn donate ẩn danh hoặc gửi lời nhắn động viên kèm emoji.

2. **Thanh toán song ngữ đa cổng:**
   - **Tiếng Việt (VietQR):** Sinh mã QR chuẩn VietQR động chứa đúng số tài khoản, số tiền và mã đơn `BMCxxxxx`. Tích hợp nút sao chép 1 chạm và tải ảnh QR.
   - **Quốc tế (Tip4Serv):** Hỗ trợ USD/EUR qua thẻ Visa/Mastercard và PayPal dành cho bạn bè quốc tế.

3. **Tự động xác nhận giao dịch (Real-time Instant Confirmation):**
   - Webhook SePay lắng nghe biến động số dư tài khoản ngân hàng (MBBank, Vietcombank, Techcombank, VPBank, ACB, v.v.).
   - Backend Google Apps Script so khớp mã đơn và số tiền chuyển khoản.
   - Frontend tự động phát hiện thanh toán thành công và kích hoạt hiệu ứng pháo hoa rực rỡ ăn mừng!

4. **Trang Quản trị Admin chuyên nghiệp:**
   - Đăng nhập bảo mật qua GitHub OAuth.
   - Bảng điều khiển thống kê tổng doanh thu (VND & USD), số ly cà phê, tỷ lệ chuyển đổi.
   - Quản lý lịch sử giao dịch: lọc trạng thái (SUCCESS, PENDING, EXPIRED, CANCELLED), tìm kiếm theo tên/mã đơn.
   - Xuất dữ liệu giao dịch ra file CSV chuẩn UTF-8 BOM hiển thị chuẩn tiếng Việt trên Microsoft Excel.
   - Cung cấp công cụ mô phỏng Webhook SePay (Webhook Simulator) để kiểm thử ngay trên trình duyệt mà không cần chuyển tiền thật.

---

## 🛠️ Hướng Dẫn Cài Đặt & Triển Khai Chi Tiết (Từng Bước)

### Bước 1: Chuẩn Bị Google Sheets Làm Cơ Sở Dữ Liệu
1. Truy cập [sheets.new](https://sheets.new) để tạo một bảng tính Google Sheets mới.
2. Đổi tên bảng tính thành: `Buy Me a Coffee Ledger`.
3. Trên thanh menu, chọn **Tiện ích mở rộng (Extensions)** → **Apps Script**.

### Bước 2: Triển Khai Backend Google Apps Script
1. Xóa nội dung mặc định trong tệp `Code.gs` của Apps Script.
2. Mở tệp `google-apps-script/Code.gs` trong kho mã nguồn này và sao chép toàn bộ nội dung dán vào Apps Script.
3. Chọn hàm `setupSheets` trên thanh công cụ và nhấn nút **Chạy (Run)** để hệ thống tự động khởi tạo cấu trúc các sheet (`Transactions`, `Settings`, `Logs`) cùng các cột dữ liệu. Cấp quyền truy cập nếu Google yêu cầu.
4. Triển khai Web App:
   - Nhấp vào nút **Triển khai (Deploy)** ở góc trên bên phải → **Tùy chọn triển khai mới (New deployment)**.
   - Chọn loại: **Ứng dụng web (Web app)**.
   - Mô tả: `Buy Me a Coffee API v1`.
   - Thực thi dưới quyền (Execute as): **Tôi (Me)**.
   - Ai có quyền truy cập (Who has access): **Bất kỳ ai (Anyone)** *(Bắt buộc để SePay và Frontend có thể gọi webhook)*.
   - Nhấn **Triển khai (Deploy)** và **sao chép URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).

### Bước 3: Cấu Hình SePay Webhook (Ngân Hàng Việt Nam)
1. Đăng ký tài khoản miễn phí tại [my.sepay.vn](https://my.sepay.vn).
2. Vào mục **Tài khoản ngân hàng** → Kết nối tài khoản ngân hàng của bạn (MB, VCB, ACB, TPB,...).
3. Vào mục **Tích hợp Webhook** → Nhấp **Tạo Webhook mới**:
   - **URL Webhook:** Dán URL Web App Google Apps Script vừa copy ở Bước 2.
   - **Phương thức:** `POST`.
   - **Kiểu dữ liệu:** `JSON`.
   - Lưu lại cấu hình.

### Bước 4: Cấu Hình Tip4Serv (Thanh Toán Quốc Tế)
1. Đăng ký tài khoản tại [tip4serv.com](https://tip4serv.com).
2. Kết nối tài khoản Stripe hoặc PayPal.
3. Tạo sản phẩm dạng Donate với đơn giá mong muốn ($2 hoặc $3 USD).
4. Cấu hình Webhook trong Tip4Serv trỏ về URL Web App Google Apps Script kèm tham số `?action=webhook_tip4serv`.

### Bước 5: Cấu Hình Đăng Nhập Quản Trị Bằng GitHub OAuth
1. Truy cập [GitHub Developer Settings](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Điền thông tin:
   - **Application name:** `Buy Me a Coffee Admin`.
   - **Homepage URL:** URL website của bạn trên GitHub Pages.
   - **Authorization callback URL:** URL ứng dụng web Google Apps Script của bạn.
3. Nhấn **Register application**, tạo **Client Secret** và lưu lại.
4. *(Tùy chọn nhanh)*: Bạn cũng có thể đăng nhập tức thì vào trang quản trị bằng **Admin Secret Token** mặc định là `admin123`.

### Bước 6: Tự Động Triển Khai Lên GitHub Pages Bằng GitHub Actions
1. Đẩy toàn bộ mã nguồn lên repository GitHub của bạn trên nhánh `main`.
2. Truy cập vào kho mã nguồn trên GitHub → Chọn tab **Settings** → Menu **Pages** bên trái.
3. Tại phần **Build and deployment**:
   - Mục **Source**: Chọn **GitHub Actions**.
4. GitHub Actions sẽ tự động chạy quy trình `.github/workflows/deploy.yml` để biên dịch Vite và đẩy trang lên GitHub Pages sau khoảng 1 phút.
5. Truy cập địa chỉ web của bạn tại: `https://<ten-user>.github.io/<ten-repo>/`.

---

## 🧪 Kiểm Tra Thanh Toán Thực Tế

1. Mở trang web và chọn số ly cà phê (ví dụ: 3 ly = 105,000 VND).
2. Nhấn nút **Tiến hành ủng hộ** để mở popup VietQR.
3. **Thử nghiệm với tiền thật:**
   - Dùng ứng dụng ngân hàng quét mã QR hiển thị trên màn hình.
   - Ứng dụng ngân hàng sẽ tự động điền đúng Số tài khoản, Số tiền và Nội dung chuyển khoản chứa mã `BMCxxxxx`.
   - Xác nhận chuyển khoản. Trong vòng 2-3 giây, SePay sẽ gửi webhook đến hệ thống và màn hình của bạn sẽ tự động nổ pháo hoa chúc mừng!
4. **Thử nghiệm không cần tiền thật (Test Mode):**
   - Trên modal VietQR hoặc trong tab **Kiểm thử Webhook SePay** của Trang Quản trị, nhấn nút:
     `⚡ Thử nghiệm: Giả lập chuyển khoản thành công (Test Mode)`.
   - Hệ thống sẽ kích hoạt luồng xử lý Webhook SePay và xác nhận đơn hàng thành công ngay lập tức!

---

## 🔒 Kiến Trúc Bảo Mật
- **Chống Replay Attack & Double Crediting:** Sử dụng `LockService` của Google Apps Script để đảm bảo mỗi giao dịch chỉ được xác nhận trạng thái `SUCCESS` một lần duy nhất.
- **Xác thực số tiền:** Backend luôn kiểm tra số tiền ngân hàng thực nhận phải lớn hơn hoặc bằng (`>=`) số tiền đơn hàng yêu cầu.
- **Chống XSS:** Mọi dữ liệu do người dùng nhập (Tên người ủng hộ, Lời nhắn) đều được làm sạch trước khi lưu trữ vào Google Sheets.
- **Bảo mật bí mật:** API Token, SePay Key được lưu trữ an toàn trong `ScriptProperties` của Google Apps Script, không lộ trên mã nguồn frontend.

---

## 📄 Bản Quyền
Phát hành theo giấy phép mã nguồn mở Apache-2.0. Chúc bạn nhận được nhiều sự ủng hộ từ cộng đồng! ☕🚀
