# DPrism

Ứng dụng frontend React cho MVP1: quản lý chuyên gia AI, chuẩn bị case, thiết kế plan DAG, theo dõi tiến trình, xem kết quả có truy nguồn và trao đổi riêng với một expert.

```powershell
cd frontend
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173/**. Development mặc định dùng MSW để chạy độc lập khi chưa có backend. Build production dùng API thật; có chế độ build demo riêng.

- [Hướng dẫn frontend, kiến trúc và API contract](frontend/README.md)
- [Kết quả kiểm tra](frontend/VERIFICATION.md)
- [Prototype đã chọn làm cơ sở thiết kế](ui/prototype/README.md)

Thư mục `frontend/` là ứng dụng React mới. `ui/prototype/` giữ bản prototype để đối chiếu. Backend, model gateway và LangGraph sẽ được tích hợp ở giai đoạn tiếp theo.
