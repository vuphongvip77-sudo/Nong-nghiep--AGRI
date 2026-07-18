# HƯỚNG DẪN AGRI v7.1 BACKEND FOUNDATION

## Phần website

Toàn bộ giao diện GitHub Pages vẫn hoạt động như trước.

## Phần backend mới

Thư mục:

`backend/`

Backend không chạy được trực tiếp trên GitHub Pages. Muốn thử trên máy:

1. Tải và giải nén gói.
2. Cài Node.js 20 trở lên.
3. Mở thư mục `backend`.
4. Mở Terminal.
5. Chạy `npm start`.
6. Mở `http://127.0.0.1:8787/api/health`.

## Mục đích của v7.1

- Tạo API thật.
- Tạo đăng nhập thật ở mức thử nghiệm.
- Lưu mật khẩu dạng băm.
- Chuẩn bị cho quản lý người dùng và nhật ký trên máy chủ.
- Chuẩn bị chuyển sang PostgreSQL ở bản sau.

## Không đưa mật khẩu mặc định lên hệ thống công khai

Mật khẩu mặc định chỉ dành cho thử nghiệm cục bộ.
