# ADR-003: Điều phối bằng code xác định, LLM chỉ ở trong node
**Trạng thái:** Đề xuất

**Bối cảnh.** Cần chuyên gia có "ý kiến riêng" nhưng kết quả phải lặp lại được để đo.

**Quyết định.** Ai chạy, khi nào, ai thấy gì, khi nào dừng: do code và plan quyết định (INV-1, INV-3, INV-5). LLM tự do ở **nội dung** lập luận. Mọi output vào state qua validator.

**Phương án đã loại**
- *Orchestrator LLM + subagent*: dễ dựng bản đầu nhưng độc lập và scope chỉ là lời dặn, các lần chạy không đi cùng đường, chi phí token cao.
- *Group chat tự do*: các chuyên gia đồng thuận quá nhanh, mất tính riêng.

**Hệ quả.** Mất một phần linh hoạt. Bù bằng ngôn ngữ plan đủ biểu đạt, và về sau có thể thêm kiểu `orchestrated` cho **từng cấu phần** (hợp đồng đầu ra không đổi).

**Xem lại khi** thực tế cho thấy chuyên gia thật thường tự mở rộng phạm vi mà template không bao phủ.
