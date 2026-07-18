# AGRI Platform Backend Foundation v7.1

Backend thử nghiệm dùng Node.js thuần, chưa cần cài thư viện ngoài.

## Chạy thử trên máy

1. Cài Node.js 20 hoặc mới hơn.
2. Mở Terminal tại thư mục `backend`.
3. Chạy:

```bash
npm start
```

4. Mở:

`http://127.0.0.1:8787/api/health`

## Tài khoản quản trị mặc định

- Tên đăng nhập: `admin`
- Mật khẩu: `ChangeMe123!`

Phải đổi mật khẩu trước khi triển khai thật.

## API chính

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/users`
- `POST /api/users`
- `GET /api/logs`
- `GET /api/backup`

## Cảnh báo

Đây là nền móng backend để thử nghiệm cục bộ. Chưa nên đưa trực tiếp lên Internet vì:
- Phiên đăng nhập đang lưu trong bộ nhớ.
- Dữ liệu đang lưu bằng file JSON.
- Chưa có HTTPS, giới hạn tốc độ, chống tấn công, đổi mật khẩu và phục hồi mật khẩu.
