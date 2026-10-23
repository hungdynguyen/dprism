# eval.md — Cách đánh giá hệ thống

> status: DRAFT v0.1. Giá trị đánh dấu **(Open)** cần bạn chốt.

## 1. Câu hỏi cần trả lời
1. Đánh giá của hệ thống giống đánh giá của **chính những chuyên gia thật** tới mức nào?
2. Từng thành phần (persona, KB riêng, phản biện) có thật sự đóng góp không?
3. Kết quả ổn định giữa các lần chạy không, và chi phí bao nhiêu?

## 2. Dữ liệu
- **Use case có đánh giá thật** của các chuyên gia, theo từng cấu phần. Số lượng **(Open)**: tối thiểu 8-10 để có ý nghĩa; ít hơn thì chỉ dùng để tìm lỗi, không kết luận.
- Chia **dev** (để chỉnh prompt, plan, persona) và **test** (khóa, không được chỉnh theo). Quyết định chia trước khi chạy lần đầu.
- Mỗi tài liệu KB phải có `use_case_id`.

## 3. Quy tắc hold-out (bắt buộc)
Khi test use case X, retrieval **loại mọi tài liệu có `use_case_id = X`** khỏi KB của mọi expert (ADR-006). Script kiểm tra chạy trước mỗi lần eval; phát hiện rò rỉ thì **không chạy**.
Nếu có ít use case: dùng leave-one-use-case-out.

## 4. Chỉ số
| Mức | Chỉ số | Cách tính |
|---|---|---|
| Expert × cấu phần | Khớp chính xác; lệch ≤ 1 mức; weighted kappa | So rating của agent với rating của chính người đó |
| Expert × cấu phần | Độ phủ rủi ro (recall) và độ nhiễu (precision) | Rủi ro người thật nêu, agent có nêu không, và ngược lại. Chấm bằng rubric, người hoặc LLM-judge **đã được hiệu chuẩn với người** |
| Cấu phần sau tổng hợp | Khớp với kết luận nhóm của người thật | Như trên |
| Bất đồng | Chỗ người thật bất đồng, hệ thống có bất đồng tương ứng không | Tỉ lệ khớp trên các cặp (expert, cấu phần) |
| Hệ thống | Độ biến thiên giữa các lần chạy | Chạy lặp k=5, báo cáo trung bình ± độ lệch chuẩn |
| Hệ thống | Token, thời gian, số lần retry, số lần escalate | Từ event log |

Rating là thang có thứ tự nên **dùng kappa có trọng số** thay vì chỉ độ chính xác.

## 5. Trần hợp lý
Đo mức nhất quán của chính chuyên gia thật (R4): cùng người đánh giá lại, hoặc hai người cùng vai. Đó là **trần** của hệ thống. Báo cáo mọi kết quả kèm tỉ lệ so với trần, không chỉ số tuyệt đối.

## 6. Baseline và ablation
| Mã | Cấu hình | Trả lời câu hỏi |
|---|---|---|
| B0 | 1 LLM, không persona, không KB | Mức nền |
| B1 | Persona chung, không KB riêng | Persona có giá trị không |
| B2 | Persona + KB riêng của từng expert (**bản đầy đủ**) | Giá trị của KB cá nhân hóa |
| B3 | B2 bỏ phản biện chéo | Giá trị của phản biện |
| B4 | B2 bỏ retrieval corpus use case (chỉ KB) | Kiểm tra việc dựa vào bằng chứng |

Mỗi cấu hình chạy trên cùng bộ test, cùng k lần. So sánh theo cặp, không so số tuyệt đối.

## 7. Quy trình
1. Khóa bộ test và chỉ số **trước** khi chạy.
2. Chạy script hold-out (mục 3).
3. Chạy B0-B4, mỗi cái k lần.
4. Báo cáo theo mẫu: bảng chỉ số × cấu hình, tỉ lệ so với trần, chi phí, 5 ca sai điển hình.
5. Chỉ chỉnh trên **dev**. Kết quả test chỉ để báo cáo, không để chỉnh.

## 8. Tiêu chí "đủ tốt" **(Open)**
Cần bạn chốt, ví dụ dạng: *B2 đạt ≥ X% trần ở lệch ≤ 1 mức, và hơn B1 ở mức có ý nghĩa, và chi phí ≤ Y mỗi run.* Không thể chốt trước khi có R4.

## 9. Ngân sách đánh giá
Tổng lần chạy = số use case test × số cấu hình × k. Ví dụ 10 × 5 × 5 = 250 run, mỗi run ~13 lần gọi LLM → khoảng 3.250 lần gọi. **(Open)** cần nhân với chi phí thật sau spike R7 để biết có chạy nổi không; nếu không, giảm k hoặc số cấu hình trước, đừng giảm hold-out.
