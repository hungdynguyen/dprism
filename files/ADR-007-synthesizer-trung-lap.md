# ADR-007: Synthesizer trung lập, bất đồng do code tính
**Trạng thái:** Đề xuất

**Bối cảnh.** Nếu LLM vừa tổng hợp vừa quyết định bất đồng, nó dễ thiên về ý kiến nghe hợp lý nhất và nuốt ý kiến thiểu số.

**Quyết định.** Synthesizer không có persona, chỉ đề xuất `final_rating` và tóm tắt. Code: ép `final_rating` nằm trong khoảng rating của các chuyên gia (ngoài khoảng → lấy mức cao nhất), tự tính `dissent`, `rating_spread`, `confidence_min`.

**Phương án đã loại**
- *Trung bình hoặc bỏ phiếu thuần*: mất lý do bất đồng.
- *Để chuyên gia thẩm quyền cao nhất quyết*: cần định nghĩa thẩm quyền, ngoài phạm vi v1.

**Hệ quả.** Quy tắc "mức cao nhất khi lỗi" là bảo thủ có chủ đích; tăng nguy cơ báo rủi ro quá mức.

**Xem lại khi** eval cho thấy mức rủi ro bị thổi phồng có hệ thống.
