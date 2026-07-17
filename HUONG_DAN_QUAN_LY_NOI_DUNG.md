# Hướng dẫn quản lý AGRI không cần biết lập trình

## Thêm một bài viết mới

Mở file `data/articles.json`.

1. Sao chép một khối bài viết có sẵn.
2. Đổi các trường:
   - `id`: mã không dấu, không khoảng trắng.
   - `title`: tiêu đề bài.
   - `category`: một trong `trong-trot`, `chan-nuoi`, `thuy-san`, `vietgap`, `ocop`.
   - `summary`: mô tả ngắn.
   - `keywords`: các từ khóa tìm kiếm.
   - `sections`: nội dung từng phần.
3. Lưu file và commit lên GitHub.

Website sẽ tự hiển thị bài mới, không cần sửa HTML.

## Thêm biểu mẫu

Mở `data/library/forms.json`, sao chép một mẫu và sửa nội dung.

## Thêm sách

Mở `data/library/books.json`, sao chép một mẫu và sửa nội dung.

## Nguyên tắc đặt mã

- Dùng chữ thường.
- Không dấu.
- Dùng dấu gạch nối.
- Ví dụ: `ga-sao-chuong-trai`, `vietgap-nhat-ky-san-xuat`.

## Không tự ý thay đổi

Không đổi tên các thư mục:
- `assets`
- `data`
- `pages`

Không đổi tên các file:
- `index.html`
- `data/articles.json`
- `assets/js/app.js`
- `assets/js/pages.js`
