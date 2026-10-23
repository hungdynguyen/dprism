# design.md — Kiến trúc hệ thống Expert Panel

> status: DRAFT v0.1 — chờ duyệt. Các giá trị đánh dấu **(Open)** là đề xuất, cần bạn chốt.

## 1. Hệ thống làm gì
Nhận toàn bộ tài liệu của một use case AI → nhiều chuyên gia agent (mỗi người: persona + KB riêng) đánh giá từng cấu phần rủi ro → tổng hợp thành **bảng đánh giá rủi ro**. Chất lượng đo bằng cách so với đánh giá thật của chính những chuyên gia đó (xem `eval.md`).

## 2. Bất biến (không thương lượng)
| ID | Bất biến | Ép bằng |
|---|---|---|
| INV-1 | Agent không bao giờ gọi trực tiếp agent khác. Mọi trao đổi đi qua Workflow Engine | Kiến trúc: expert chỉ nhận task và trả kết quả |
| INV-2 | Plan là **dữ liệu**, bất biến trong một run. Executor là graph cố định, không sinh lại theo run | `Plan` validate; `plan_version` gắn vào mọi event |
| INV-3 | Pha độc lập: input của chuyên gia **không** chứa ý kiến chuyên gia khác | Payload của `Send` do code dựng |
| INV-4 | Scope ép bằng code, không bằng lời dặn trong prompt | `check_assignment` + allowlist namespace khi truy xuất |
| INV-5 | Control plane chỉ đọc **trường có cấu trúc**, không đọc văn xuôi để điều phối | Review code; test |
| INV-6 | Mọi output của LLM qua validator schema trước khi vào state | `contracts/models.py` |
| INV-7 | Bất đồng do **code** tính và giữ nguyên. Synthesizer không đổi rating của ai | `Synthesis.dissent` do code sinh |
| INV-8 | Event log append-only, idempotent theo `event.id`. Checkpoint chỉ để resume | `EventLog.emit` dedupe |
| INV-9 | State chỉ giữ dữ liệu có cấu trúc và tham chiếu, không giữ tài liệu thô | Review code |
| INV-10 | Lỗi không tự giải quyết được → dừng và chuyển người, không chạy tiếp mù | Ma trận lỗi (mục 8) |

## 3. Kiến trúc: 3 mặt phẳng
```
Control plane            Execution plane            Data plane
Planner (nạp template)   Expert Runtime (agent)     Event Log
Workflow Engine          Synthesizer (trung lập)    Run State (checkpoint)
Scope Guard                                         Expert Registry (ExpertSpec)
                                                    KB từng expert, Corpus use case (theo run)
```
- **Control plane = code xác định.** LLM chỉ xuất hiện ở execution plane (và Planner khi không có template, ngoài v1).
- **Executor** = một LangGraph cố định, mỗi vòng lặp xử lý **một** cấu phần: `schedule → assess_one(song song) → after_assess → [review_one → after_review] → synthesize → gate → commit → schedule`. Hết cấu phần → `assemble → final_review`.

## 4. Kênh giao tiếp
| Kênh | Hướng | Nội dung |
|---|---|---|
| Command | Engine → Expert | Task envelope: cấu phần, upstream (`brief`), peer (chỉ ở pha phản biện) |
| Event | Expert/Engine → Event Log | Kết quả có kiểu (`contracts.Event`). UI, eval, replay đọc từ đây |
| Retrieval | Expert ↔ KB/Corpus | Đoạn trích kèm `ref` và nhãn nguồn (`usecase` / `kb`) |

**Thứ duy nhất truyền xuống cấu phần sau** là `brief` = {component, final_rating, key_reasons, open_dissent}. Không truyền transcript.

## 5. State ownership
Quy tắc: một trường chỉ do node ghi ở cột "Ghi bởi". Nhánh song song chỉ được ghi vào trường **có reducer**.

| Trường | Ghi bởi | Reducer | Đọc bởi |
|---|---|---|---|
| `run_id`, `doc_ids` | input | — | tất cả |
| `corpus` | intake | ghi đè | (tham chiếu) |
| `plan` | plan | ghi đè, **không đổi sau validate** | schedule, các route, gate, assemble |
| `current` | schedule | ghi đè | route, after_*, synthesize, gate, commit |
| `review_round` | schedule (reset 0), after_review (+1) | ghi đè | route sau after_assess/after_review |
| `component_status` | plan (khởi tạo), schedule, synthesize, commit | gộp theo id | schedule, assemble |
| `assessments` | assess_one (song song) | nối list theo cấu phần | after_assess, review, synthesize, gate |
| `reviews` | review_one (song song) | nối list theo cấu phần | tính ý kiến cuối (`effective_rows`) |
| `syntheses` | synthesize, gate | gộp theo id | route_schedule (`brief`), gate, assemble |
| `final_table`, `final_approved` | assemble, final_review | ghi đè | đầu ra |

## 6. State machine của một cấu phần
Trạng thái: `PENDING → ASSESSING → CROSS_REVIEW → SYNTHESIZING → NEEDS_HUMAN → DONE`, thêm `FAILED` (kết thúc run).

| Từ → Đến | Điều kiện (guard) |
|---|---|
| PENDING → ASSESSING | Mọi cấu phần trong `depends_on` đã DONE; chọn cái đứng trước trong plan |
| ASSESSING → CROSS_REVIEW | Mọi primary đã nộp **và** `review.mode=cross` **và** ≥2 assessment `ok` |
| ASSESSING → SYNTHESIZING | Mọi primary đã nộp, không thỏa điều kiện trên |
| CROSS_REVIEW → CROSS_REVIEW | Ý kiến chưa hội tụ (rating chưa bằng nhau) **và** `round < max_rounds` |
| CROSS_REVIEW → SYNTHESIZING | Hội tụ hoặc `round = max_rounds` |
| SYNTHESIZING → NEEDS_HUMAN | Thỏa bất kỳ luật `escalate_if`, có task `failed`, hoặc vượt ngân sách |
| SYNTHESIZING → DONE | Không có luật escalate nào kích hoạt |
| NEEDS_HUMAN → DONE | Người đưa `final_rating` hợp lệ |
| bất kỳ → FAILED | Người chọn hủy, hoặc lỗi không phục hồi |

Chọn cấu phần tiếp theo chỉ dựa vào **trạng thái và phụ thuộc**, không dựa vào nội dung kết quả.

## 7. Quyền hạn của expert
| Expert **không được** | Cơ chế ép |
|---|---|
| Đánh giá cấu phần không được gán | `check_assignment` trước mỗi lần gọi |
| Đọc KB của expert khác hoặc corpus của run khác | `retrieve` chỉ cho `kb:<mình>` và `usecase:<run>` |
| Thấy ý kiến người khác ở pha độc lập | Payload do code dựng (INV-3) |
| Ghi thay người khác hoặc thay Synthesis | Output chỉ vào `assessments` của chính mình; kiểm tra `expert`/`component` khớp task |
| Khẳng định khi không có bằng chứng | Validator: `ok` bắt buộc có `evidence`; có lối `insufficient_info` |
| Gọi tool/mạng ngoài | v1 không cấp tool nào ngoài retrieval |
| Quyết định cuối | Chỉ `gate` (người) và `final_review` |

## 8. Ma trận lỗi
| Lỗi | Hành vi | Scenario |
|---|---|---|
| Output sai schema | Gửi lý do lỗi, thử lại tới `max_retries_per_task` | SC-10 |
| Hết retry (assess) | Ghi `status=failed`, cấu phần đi tiếp tới gate rồi escalate | SC-11 |
| Hết retry (review) | Giữ nguyên ý kiến trước, ghi event | SC-12 |
| Exception hạ tầng trong một nhánh song song | Bắt trong node, ghi `failed` như SC-11, không làm sập các nhánh khác | SC-13 |
| Chuyên gia báo `insufficient_info` | Escalate | SC-14 |
| Rating chênh ≥ ngưỡng, hoặc confidence thấp | Escalate | SC-15 |
| Người trả quyết định không hợp lệ | Hỏi lại, không chạy tiếp | SC-16 |
| Dừng giữa chừng rồi chạy lại | Resume từ checkpoint, không ghi trùng event | SC-17, SC-18 |
| Vượt ngân sách | Dừng trước lần gọi LLM kế tiếp, cấu phần → NEEDS_HUMAN | SC-21 |

## 9. Ngân sách token và thời gian **(Open: toàn bộ giá trị cần bạn chốt)**
Số lần gọi LLM cho một cấu phần = `n_primary` + `n_primary × số vòng review` + 1 (synthesize). Plan mẫu (C1:2 primary có review, C2:1, C3:2 có review) = 5 + 2 + 5 = **12 lần**, cộng 1 lần intake.

| Tham số | Đề xuất |
|---|---|
| Output tối đa mỗi lần gọi | 2000 token (assess/review), 1500 (synthesize) |
| Input tối đa mỗi lần gọi | 12k token (cắt top-k đoạn trích) |
| Retrieval | top-3 mỗi namespace |
| Retry | `max_retries_per_task` trong plan (mẫu: 2) |
| Vòng phản biện | theo plan; cứng ≤ 3 |
| Trần token mỗi run | 200k |
| Trần thời gian mỗi run | 30 phút, không tính thời gian chờ người |
| Ở 80% trần | event `budget_warning` |
| Ở 100% trần | event `budget_exceeded`, dừng trước lần gọi kế tiếp |

## 10. Dữ liệu và ranh giới
- Log và event chỉ chứa **tham chiếu** (`ref`) và số liệu, không chứa toàn văn tài liệu.
- Tài liệu use case và KB chỉ rời hệ thống khi gửi tới LLM provider. **(Open)** provider nào, có được gửi dữ liệu nhạy cảm không → xem `risks.md` R11.

## 11. Ngoài phạm vi v1
Chạy song song nhiều cấu phần · `STALE`/đánh giá lại · rẽ nhánh theo kết quả · planner dùng LLM · chuyên gia `consulted` · hội thoại nhiều lượt tự do · tool ngoài.

## 12. Khác biệt giữa spec này và skeleton `expert_panel/`
Skeleton chạy được nhưng **chưa** đúng spec ở các điểm sau (cần sửa khi implement):
1. Chỉ dùng trạng thái PENDING/ASSESSING/SYNTHESIZING/DONE; chưa có CROSS_REVIEW, NEEDS_HUMAN, FAILED.
2. Exception hạ tầng trong nhánh song song chưa được bắt (SC-13).
3. Chưa có ngân sách token (SC-21).
4. Quyết định của người chưa được validate (SC-16).
5. Validate plan viết lặp trong `graph.py`; nên dùng `contracts.Plan`.
6. Chưa có event `plan_version` trên mọi event.
