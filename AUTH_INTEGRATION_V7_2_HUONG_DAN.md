# AGRI v7.2 — Auth Integration

## Đường dẫn

- Đăng nhập: `/platform/auth/`
- Quản trị qua API: `/platform/admin/`

## Cách thử trên máy

1. Chạy backend trong thư mục `backend` bằng `npm start`.
2. Mở giao diện bằng một web server cục bộ, không mở trực tiếp file HTML.
3. Vào `/platform/auth/`.
4. Backend mặc định: `http://127.0.0.1:8787`.
5. Đăng nhập bằng tài khoản thử nghiệm trong README backend.
6. Mở `/platform/admin/`.

## Lưu ý

Trang GitHub Pages công khai không nên dùng mật khẩu thử nghiệm mặc định. Khi triển khai thật cần:
- HTTPS
- Tên miền backend
- CORS đúng tên miền
- Mật khẩu mạnh
- Cơ sở dữ liệu
- Quản lý phiên lâu dài
