# scenarios.md — Kịch bản hành vi

> status: DRAFT v0.1. Mỗi scenario sẽ thành một test chạy với MockLLM (có chèn lỗi).
> "Skeleton" = bản `expert_panel/` đã chạy thử. **Đã thử tay** = thấy đúng khi chạy, **chưa có test tự động**.

| ID | Tên | Liên quan | Skeleton |
|---|---|---|---|
| SC-01 | Chạy đủ 3 cấu phần theo thứ tự | — | Đã thử tay |
| SC-02 | Đánh giá độc lập | INV-3 | Chưa |
| SC-03 | Phản biện chéo | ADR-005 | Đã thử tay |
| SC-04 | Cấu phần 1 chuyên gia bỏ qua phản biện | — | Đã thử tay |
| SC-05 | Cấu phần sau chỉ nhận `brief` | INV-9 | Chưa |
| SC-06 | Bất đồng được giữ nguyên | INV-7 | Đã thử tay |
| SC-07 | Synthesizer trả rating ngoài khoảng | INV-7 | Chưa |
| SC-08 | Plan có chu trình bị chặn | INV-2 | Đã thử tay |
| SC-09 | Plan không từ template cần người duyệt | INV-2 | Chưa |
| SC-10 | Output sai schema, retry thành công | INV-6 | Đã thử tay |
| SC-11 | Hết retry ở bước đánh giá | INV-10 | Chưa |
| SC-12 | Hết retry ở bước phản biện | INV-10 | Chưa |
| SC-13 | Exception hạ tầng trong một nhánh song song | INV-10 | **Chưa, và code chưa xử lý** |
| SC-14 | Chuyên gia báo thiếu thông tin | INV-10 | Chưa |
| SC-15 | Rating chênh lệch hoặc confidence thấp | INV-10 | Đã thử tay |
| SC-16 | Quyết định của người không hợp lệ | INV-10 | **Chưa, và code chưa xử lý** |
| SC-17 | Resume sau interrupt không ghi trùng event | INV-8 | Đã thử tay (kiểm id) |
| SC-18 | Dừng giữa chừng rồi chạy lại | INV-8 | Chưa |
| SC-19 | Expert ngoài assignment bị chặn | INV-4 | Đã thử tay |
| SC-20 | Truy xuất namespace của người khác bị chặn | INV-4 | Đã thử tay |
| SC-21 | Vượt ngân sách token | INV-10 | **Chưa, và code chưa xử lý** |

## Luồng chính

**SC-01 · Chạy đủ 3 cấu phần theo thứ tự**
- Given plan mẫu (C1 → C2 → C3)
- When run chạy xong
- Then C1, C2, C3 lần lượt DONE; `assemble` ra 3 dòng; thứ tự `component_start` là C1, C2, C3

**SC-02 · Đánh giá độc lập**
- Given C1 có 2 primary (privacy, legal)
- When `assess_one` chạy cho privacy
- Then payload của nhánh đó không chứa assessment hay review của legal (và ngược lại)

**SC-03 · Phản biện chéo**
- Given C1 có `review.mode=cross`, `max_rounds=1`, cả hai assessment `ok`
- When pha đánh giá xong
- Then mỗi chuyên gia nhận ý kiến của người kia và nộp đúng một review; trạng thái qua CROSS_REVIEW

**SC-04 · Cấu phần 1 chuyên gia bỏ qua phản biện**
- Given C2 chỉ có 1 primary, `review.mode=none`
- When đánh giá xong
- Then không có `review` nào của C2; đi thẳng tới synthesize

**SC-05 · Cấu phần sau chỉ nhận `brief`**
- Given C1 DONE với đủ assessment và review
- When `assess_one` của C2 được dựng payload
- Then `upstream` chỉ có {component, final_rating, key_reasons, open_dissent}; không có rationale thô hay transcript

## Tổng hợp và bất đồng

**SC-06 · Bất đồng được giữ nguyên**
- Given C1: privacy=high, legal=medium sau phản biện, final_rating=high
- When synthesize xong
- Then `dissent` chứa đúng legal=medium; rating của hai chuyên gia không bị sửa

**SC-07 · Synthesizer trả rating ngoài khoảng**
- Given ý kiến cuối là medium và high; synthesizer trả `low`
- When synthesize xong
- Then `final_rating` = high (mức cao nhất); có ghi event; `dissent` tính theo giá trị này

## Plan

**SC-08 · Plan có chu trình bị chặn**
- Given plan mà C1 phụ thuộc C3, C3 phụ thuộc C1
- When `validate_plan` chạy
- Then run dừng với lỗi "chu trình"; không có lần gọi LLM nào

**SC-09 · Plan không từ template cần người duyệt**
- Given plan có `source` không bắt đầu bằng `template:`
- When `validate_plan` chạy
- Then graph dừng ở `interrupt`; chỉ chạy tiếp khi người duyệt

## Lỗi và ngoại lệ

**SC-10 · Output sai schema, retry thành công**
- Given LLM trả assessment thiếu `evidence` ở lần đầu
- When node xử lý
- Then ghi event `retry` kèm lý do; lần hai hợp lệ thì dùng; không escalate

**SC-11 · Hết retry ở bước đánh giá**
- Given LLM sai schema ở mọi lần thử (1 + `max_retries_per_task`)
- When hết lượt thử
- Then assessment `status=failed`; các nhánh khác không bị ảnh hưởng; cấu phần chuyển NEEDS_HUMAN

**SC-12 · Hết retry ở bước phản biện**
- Given review của một chuyên gia sai schema ở mọi lần thử
- When hết lượt thử
- Then giữ nguyên ý kiến trước đó, ghi event; cấu phần không dừng

**SC-13 · Exception hạ tầng trong một nhánh song song**
- Given 2 nhánh `assess_one`; nhánh privacy ném timeout/exception
- When barrier chạy
- Then nhánh privacy thành `failed`, nhánh legal vẫn lưu; cấu phần NEEDS_HUMAN; run không sập

**SC-14 · Chuyên gia báo thiếu thông tin**
- Given một assessment `insufficient_info`
- When tới `gate`
- Then escalate với lý do "thiếu thông tin"; người có thể bổ sung hoặc đưa final_rating

**SC-15 · Rating chênh lệch hoặc confidence thấp**
- Given `rating_spread_at_least=2` và ý kiến cuối là medium và critical (hoặc confidence nhỏ nhất < 0.5)
- When tới `gate`
- Then run dừng ở `interrupt` kèm lý do và synthesis; chạy tiếp sau khi người quyết định; có event `escalate` và `human_decision`

**SC-16 · Quyết định của người không hợp lệ**
- Given gate đang chờ; người trả `final_rating` ngoài thang hoặc thiếu
- When resume
- Then hệ thống từ chối và hỏi lại; cấu phần không chuyển DONE

## Bền vững và an toàn

**SC-17 · Resume sau interrupt không ghi trùng event**
- Given run dừng ở `gate` (node sẽ chạy lại khi resume)
- When người quyết định và run tiếp tục
- Then mỗi `event.id` xuất hiện đúng một lần trong log

**SC-18 · Dừng giữa chừng rồi chạy lại**
- Given tiến trình chết khi C1 đã xong 1/2 assessment
- When chạy lại với cùng `thread_id`
- Then không gọi LLM lại cho các việc đã xong **(Open: cần spike R3 xác nhận hành vi của LangGraph)**; không event trùng

**SC-19 · Expert ngoài assignment bị chặn**
- Given security không được gán cho C1
- When có task giao security làm C1
- Then `ScopeViolation`, không gọi LLM

**SC-20 · Truy xuất namespace của người khác bị chặn**
- Given privacy đang chạy
- When yêu cầu `kb:legal`
- Then `ScopeViolation`; có event

**SC-21 · Vượt ngân sách token**
- Given trần token của run còn 1 lần gọi
- When chuẩn bị gọi LLM tiếp theo vượt trần
- Then không gọi; event `budget_exceeded`; cấu phần hiện tại NEEDS_HUMAN
