# ADR-002: Dùng LangGraph làm executor
**Trạng thái:** Đề xuất

**Bối cảnh.** Cần fan-out song song có barrier, vòng lặp có chặn, dừng chờ người, checkpoint để resume.

**Quyết định.** LangGraph (`Send`, `interrupt`, checkpointer). Giữ logic điều phối trong code của mình, không dựa vào khái niệm "manager" của framework.

**Phương án đã loại**
- *CrewAI (Crews/Hierarchical)*: manager là LLM nên routing mang tính xác suất, khó lặp lại. Có thể dùng **bên trong** một node nếu cần.
- *Tự viết state machine*: kiểm soát tối đa nhưng phải tự làm checkpoint và interrupt.
- *Durable execution (Temporal)*: mạnh hơn nhưng quá nặng cho giai đoạn đầu.

**Hệ quả.** Phải xử lý các bẫy đã biết: reducer cho nhánh song song, node chạy lại khi resume sau `interrupt`, `recursion_limit`. API đổi theo phiên bản nên ghim phiên bản (đã thử trên 1.2.16).

**Xem lại khi** run kéo dài hàng giờ hoặc cần độ bền cao hơn checkpoint hiện có.
