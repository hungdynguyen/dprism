# ADR-004: Event log tách khỏi checkpoint
**Trạng thái:** Đề xuất

**Bối cảnh.** Checkpoint của LangGraph phục vụ resume, nhưng UI, audit và evaluation cần lịch sử bền vững.

**Quyết định.** Ghi event vào log riêng (append-only), id xác định và dedupe (INV-8). Checkpoint chỉ để resume. State không chứa lịch sử dài.

**Phương án đã loại**
- *Dùng checkpoint làm audit*: định dạng nội bộ, đổi theo phiên bản, không dành cho truy vấn.
- *Lưu event trong state*: state phình theo thời gian, mỗi bước đều phải serialize lại.

**Hệ quả.** Node có tác dụng phụ phải idempotent vì LangGraph chạy lại cả node khi resume sau `interrupt`.

**Xem lại khi** cần stream sự kiện cho nhiều consumer ở quy mô lớn (khi đó chuyển sang queue).
