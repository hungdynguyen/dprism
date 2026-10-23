# ADR-005: Độc lập → phản biện → tổng hợp
**Trạng thái:** Đề xuất

**Bối cảnh.** Nhiều chuyên gia cho một cấu phần; cần giữ ý kiến riêng và nêu được bất đồng.

**Quyết định.** Pha 1: mỗi chuyên gia đánh giá độc lập (không thấy nhau). Pha 2: thấy ý kiến người khác, giữ hoặc đổi ý, tối đa `max_rounds`. Pha 3: Synthesizer trung lập; bất đồng do code tính (INV-7).

**Phương án đã loại**
- *Một vòng duy nhất không phản biện*: bỏ lỡ cơ hội chuyên gia sửa sai.
- *Hội thoại tự do nhiều lượt*: tốn token, khó kiểm toán, dễ đồng thuận giả.
- *Lấy trung bình rating*: che mất bất đồng, vốn là thông tin quan trọng.

**Hệ quả.** Có thêm lần gọi LLM cho cấu phần nhiều chuyên gia. Tiền lệ phương pháp: Delphi bằng LLM.

**Xem lại khi** đo thấy phản biện làm các chuyên gia nhái nhau (R8 trong `risks.md`).
