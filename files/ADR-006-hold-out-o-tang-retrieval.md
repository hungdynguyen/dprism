# ADR-006: Hold-out khi đánh giá thực hiện ở tầng retrieval
**Trạng thái:** Đề xuất

**Bối cảnh.** KB của expert là tài liệu họ từng viết, còn ground truth cũng là đánh giá của họ. Nếu KB chứa đánh giá của chính use case đang test thì hệ thống chỉ chép đáp án.

**Quyết định.** Mỗi tài liệu trong KB gắn `use_case_id`. Khi test use case X, retrieval **loại** mọi tài liệu có `use_case_id = X`, với mọi expert. Có script kiểm tra tự động trước mỗi lần chạy eval.

**Phương án đã loại**
- *Dựng lại KB riêng cho mỗi lần test*: tốn, dễ sai.
- *Tin rằng KB không chứa đáp án*: không kiểm chứng được.

**Hệ quả.** Cần metadata `use_case_id` đầy đủ khi nạp KB. Thiếu metadata thì không chạy eval.

**Xem lại khi** ít use case đến mức leave-one-out làm KB quá nghèo.
