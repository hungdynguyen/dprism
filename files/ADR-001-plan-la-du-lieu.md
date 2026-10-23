# ADR-001: Plan là dữ liệu, executor là graph cố định
**Trạng thái:** Đề xuất

**Bối cảnh.** Mỗi use case có thể cần cấu phần và chuyên gia khác nhau. Cần chỗ để thay đổi mà không đổi cách chạy.

**Quyết định.** Planner chỉ sinh/nạp **Plan** (JSON, validate bằng `contracts.Plan`). Executor là một LangGraph viết sẵn, đọc plan và chạy. Plan bất biến trong một run, có `plan_version`.

**Phương án đã loại**
- *Planner sinh graph hoặc code riêng cho mỗi run*: khó test, replay và so sánh giữa các run; lỗi chỉ lộ lúc chạy.
- *Không có plan, một agent tự quyết từng bước*: không lặp lại được, không đo được so với chuyên gia thật.

**Hệ quả.** Thêm loại task = thêm template. Phần rẽ nhánh phức tạp (lồng nhau, điều kiện theo kết quả) phải biểu diễn trong ngôn ngữ của plan, không thêm graph mới.

**Xem lại khi** nhiều quy trình thật không biểu diễn nổi bằng plan hiện tại.
