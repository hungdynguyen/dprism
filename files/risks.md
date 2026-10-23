# risks.md — Điều chưa biết và cách kiểm chứng sớm

> status: DRAFT v0.1. Mức: **H** = có thể làm sập thiết kế/giá trị, **M** = tốn công sửa, **L** = chịu được.
> Mỗi rủi ro có một **spike**: thử nghiệm nhỏ (≤ 2 ngày) cho kết quả đi/không đi.

| ID | Điều chưa biết | Nếu sai thì | Mức | Spike để biết sớm |
|---|---|---|---|---|
| R1 | Persona + KB có thật sự tái tạo được kết luận của chuyên gia? | Cả giá trị của hệ thống | **H** | Chạy 1 expert × vài cấu phần trên use case cũ; so với đánh giá thật; ablation: persona chung / persona + KB |
| R2 | RAG có truy xuất đúng đoạn cần trên tài liệu use case dài, nhiều định dạng? | Bằng chứng sai, đánh giá sai | **H** | Lấy 5 câu hỏi mà bạn biết đáp án nằm ở đâu; đo tỉ lệ truy xuất đúng |
| R3 | LangGraph có xử lý đúng: nhánh song song lỗi, resume sau crash, `interrupt` chạy lại node? | Mất dữ liệu hoặc ghi trùng | **H** | Skeleton + chèn lỗi (kill giữa chừng, exception một nhánh); xác nhận SC-13, SC-17, SC-18 |
| R4 | Chính chuyên gia thật nhất quán với nhau và với bản thân tới đâu? | Không biết "đủ tốt" là bao nhiêu | **H** | Xin 2-3 case được đánh giá hai lần hoặc bởi hai người cùng vai; đo độ khớp |
| R5 | KB có chứa đánh giá của chính use case test (rò rỉ)? | Số đo đẹp giả | **H** | Script kiểm tra `use_case_id` (ADR-006) trước mỗi lần eval |
| R6 | Mức độ biến thiên giữa các lần chạy lặp? | Số đo nhiễu, khó kết luận | M | Chạy cùng 1 case 5 lần; xem độ lệch của rating |
| R7 | Chi phí và độ trễ thực tế so với ngân sách? | Không dùng được | M | Chạy 1 run thật, ghi token và thời gian từng bước |
| R8 | Phản biện có làm các chuyên gia nhái nhau? | Mất "ý kiến riêng" | M | So tỉ lệ đổi ý và độ phân tán rating trước và sau phản biện |
| R9 | Synthesizer có nuốt hoặc làm nhẹ bất đồng? | Mất thông tin quan trọng | M | Soạn 3 case có bất đồng rõ; kiểm tra `dissent` (do code) và `summary` (do LLM) |
| R10 | Template và thang rủi ro thật khác giả định (ma trận cấu phần × chuyên gia)? | Plan sai, phải sửa nhiều | M | Duyệt ma trận với chuyên gia thật trước khi khóa spec |
| R11 | Dữ liệu use case có được gửi tới LLM provider không? | Vi phạm tuân thủ | **H** | Hỏi bộ phận pháp lý/bảo mật trước khi nạp dữ liệu thật; chọn provider được duyệt |
| R12 | Cấu phần có vòng phụ thuộc trong thực tế? | Cần cơ chế hội tụ | L | Xem template thật; nếu có thì gộp thành 1 cấu phần nhiều chuyên gia |

## Thứ tự nên làm
1. **R11, R10, R4** là câu hỏi cho con người, trả lời được trước khi viết code.
2. **R3** trước khi khóa state design (rẻ, và đang quyết định mục 5-6 của `design.md`).
3. **R5** là điều kiện để mọi số đo ở `eval.md` có ý nghĩa.
4. **R1, R2** cần KB thật; làm ngay khi có dữ liệu.
