# AGRI Data Model v1.0

AGRI sử dụng dữ liệu JSON làm nguồn nội dung chính.

## Article
- `id`: mã duy nhất
- `type`: loại nội dung
- `category`: chuyên mục
- `title`: tiêu đề
- `summary`: mô tả ngắn
- `keywords`: từ khóa
- `entityIds`: đối tượng liên quan
- `related`: bài liên quan
- `sections`: nội dung hiển thị
- `updated`: ngày cập nhật

## Entity
Đối tượng nông nghiệp như cây trồng, vật nuôi, tiêu chuẩn hoặc nhóm kỹ thuật.

## Form
Biểu mẫu Word, Excel hoặc PDF.

## Book
Sách và cẩm nang AGRI.

Website hiện tại tiếp tục đọc `data/articles.json`, nên bản cập nhật không làm hỏng giao diện đang chạy.
