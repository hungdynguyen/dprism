# DPrism React frontend

Ứng dụng React thay thế prototype tại `../ui/prototype`, triển khai theo [frontend.md](../../frontend.md). Prototype được giữ làm tài liệu đối chiếu; ứng dụng mới không nhúng HTML cũ, không gọi các hàm JavaScript toàn cục của prototype.

## Chạy

Yêu cầu Node.js 24 trở lên. Từ thư mục repository:

```powershell
cd frontend
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173/**. Chế độ development mặc định bật MSW, không cần backend hoặc model để kiểm tra các luồng. Có nhãn **Dữ liệu mô phỏng** trên giao diện.

```powershell
npm run lint
npm test
npm run test:coverage
npm run build
```

Build production tại `dist/` mặc định **không bật MSW**, cần API thật. Để chạy bản build độc lập với dữ liệu mô phỏng:

```powershell
npm run build:demo
npm run preview
```

Preview dùng cổng **5174**, tách biệt với prototype Python ở cổng 4173. `npm run format` và `npm run format:check` dùng Prettier được pin version.

## Kiến trúc

- React 19.0.0, TypeScript 5.8.3 strict, Vite 6.3.5, React Router 7.15.0; dependency và lockfile được pin.
- `App.tsx`: QueryClientProvider → ConfirmProvider → BrowserRouter → layout route AppShell / Outlet. Auth query hoàn tất trước khi mount các route. Error boundary bao ngoài ứng dụng.
- `pages/`: component route; `components/`: primitive và component theo domain, với thư mục `layout`, `transitions`, `plan`, `results`.
- `hooks/`: React Query theo domain, query-key factory, mutation/invalidation, polling có điều kiện. Component không gọi API client trực tiếp.
- `services/api.ts`: toàn bộ network call, `request<T>`, ApiError, credentials, redirect 401, FormData upload và AbortSignal.
- `types/`: contract frontend; `utils/`: validation, DAG ordering/layout, trạng thái, tìm kiếm, export và khôi phục bản nháp.
- Một Zustand store duy nhất cho lịch sử chat, persist có version và giới hạn 50 cuộc trao đổi. Pending request không được persist. Hội thoại chưa có phản hồi sau reload được đánh dấu để thử lại.
- Case draft là server state; editor giữ state cục bộ, autosave debounce, mutation theo hàng đợi cho từng case và cache có revision. Recovery trong sessionStorage giúp giữ chỉnh sửa khi lưu lỗi. Danh mục expert chỉ đọc; không có form tạo hoặc chỉnh sửa expert trong ứng dụng.
- `mocks/`: MSW browser/node, fixture và mock execution. Đặt sau API boundary; không được import vào page/component. Trong bản demo, mock database lưu riêng trong localStorage. Backend thật sẽ thay thế phần này.
- `test/`: toàn bộ unit/component/integration test; network mock ở MSW, không mock module api.ts. Setup dùng cùng fetch/Request/Response/FormData của undici để tránh lệch realm trên Node 24.
- Tailwind 3.4, token tập trung, Lucide, primitive tự viết, animation registry Framer Motion và reduced motion. Không thêm UI kit, axios, form/schema library hoặc clsx.

Những lựa chọn có chủ đích so với ví dụ Wiki Maintainer: DAG/argument map dùng SVG và React để giữ layout tất định và node truy cập được bằng bàn phím; không dùng WebGL `reagraph` của đồ thị liên kết wiki. Chưa có use case diff nên không cài diff viewer. Build mặc định ra `dist` vì repo chưa có backend; có thể đặt `FRONTEND_OUT_DIR=../backend/frontend` trong env khi tích hợp. Route được lazy-load, import named export qua alias `@/`.

## Các luồng đã triển khai

1. Welcome: hai lựa chọn, không sidebar; logo và nút Về trang chủ.
2. Expert: danh sách/tìm kiếm/lĩnh vực → hồ sơ chỉ đọc, xem SKILL.md. Hai entry point dùng chung ExpertCard: tên mở hồ sơ; một nút Trao đổi riêng ở cuối thẻ. Không có select mode, radio, thanh xác nhận, nút Mới hay tạo/chỉnh sửa expert. URL chỉnh sửa cũ chuyển về danh sách.
3. Cases là workspace ngay sau Welcome: ba lựa chọn bắt đầu ở đầu trang, lịch sử bản nháp/phiên chạy, case chia sẻ và trao đổi riêng ở dưới. Chọn cách làm trước khi đặt tên; không còn màn hình chọn hình thức sau khi tạo case.
4. Dùng template → đặt tên → màn hình chọn template riêng (`/cases/:id/templates`) → review plan. Thư viện 8 template có tìm kiếm không dấu, lọc, sắp xếp, phân trang, empty state. Bản nháp chưa chọn template tiếp tục đúng tại thư viện; quay lại cùng template giữ task đã chỉnh, thay template khác có xác nhận.
5. Thảo luận theo chủ đề → đặt tên → STAR/đầu ra/tài liệu → case tham khảo → thiết kế plan → review. Tạo lại đề xuất là thao tác rõ ràng có xác nhận, không chạy lại khi quay về bước trước.
6. Planning: DAG bên trái, task detail phía dưới, thông tin case bên phải. Chỉ hai inspector cuộn; outer viewport được cô lập overflow. Có Fit/zoom/pan, chọn node bằng bàn phím, thêm/xóa/Undo, chỉnh dependencies, expert, tài liệu, số vòng và token budget. Màn hình nhỏ chuyển panel bằng tab.
7. Validation chặn DAG cycle/missing dependency, task thiếu expert/đầu ra, số vòng và budget không hợp lệ. Plan được cố định sau Start; backend phải kiểm tra lại độc lập.
8. Chạy: DAG chỉ đọc, spinner ở pipeline và task đang xử lý, polling API giữ nguyên DAG/zoom/lựa chọn khi cập nhật hoặc lỗi tạm thời. Loading ban đầu giữ khung panel và thanh điều hướng. Khi terminal, hiện thông báo mở kết quả 700ms, preload dashboard rồi tự chuyển; không thay đổi thời gian thực thi task. Mock API tính tiến trình theo đồng hồ, mỗi task 3 giây, tiếp tục khi rời trang/reload. Không có nút điều khiển runtime cho người dùng.
9. Kết quả: participants, argument map, ý kiến expert, inspector bằng chứng và bất đồng có cấu trúc. Giữ cả bất đồng khi rating giống nhau. Báo cáo gồm nguồn, upstream brief, full snapshot và trace; xuất JSON/Markdown; chia sẻ/thu hồi toàn bộ case.
10. Trao đổi một expert: từ danh sách/hồ sơ expert → đặt tên case → chat; từ workspace Cases → chọn Trao đổi riêng → chọn expert → đặt tên case → chat. Case trực tiếp cũ đã có tên có thể vào chat từ thẻ mà không đặt tên lại. Một case có một hội thoại; muốn bắt đầu vấn đề khác với cùng expert thì đặt tên case mới. Màn hình chat một cột, transcript cuộn nội bộ, composer cố định phía dưới; không có panel thông tin, chỉnh sửa hoặc đổi expert. Enter gửi, Shift+Enter xuống dòng, có kiểm tra IME, pending/error/retry/abort và markdown. Lưu case thành công rồi mới tạo hội thoại local; retry không tạo trùng case. Nội dung chưa có backend lưu hội thoại; chat hiện được giữ trên trình duyệt theo pattern tài liệu. Nếu một case tham chiếu chat không có trên trình duyệt hiện tại, có đường quay lại chọn expert.

## Nối backend thật

Tạo `frontend/.env.development.local` để override `.env.development`:

```dotenv
VITE_ENABLE_MOCKS=false
VITE_API_URL=
API_PROXY_TARGET=http://127.0.0.1:8000
```

Khởi động lại Vite. `VITE_API_URL` rỗng dùng cùng origin và Vite proxy `/api`, `/ws`; có thể dùng base URL riêng nếu backend đã cấu hình CORS/credentials. Không đặt model key hoặc thông tin OBO trong biến `VITE_*` vì các biến này nằm trong client bundle.

`types/index.ts` và `services/api.ts` là contract ban đầu để triển khai backend tiếp. Các endpoint:

- `GET /api/users/me`: user + `capabilities.appEnabled`; 401 do API client xử lý tập trung.
- Giao diện chỉ dùng `GET /api/experts`, `GET /api/experts/:id`, `GET /api/skills`. Các hàm/handler POST/PUT expert còn giữ tại API boundary để tương thích, không có thao tác tương ứng trên UI; phân quyền phải do backend thực thi.
- `GET/POST /api/templates`: version và bản sao task/document của template.
- `GET/POST /api/cases`, `GET/PUT /api/cases/:id`: tạo draft nhận `title`, `method` (template/open/direct) và `referenceCaseIds`; draft có revision, STAR, output, tasks, tài liệu, references, run/chat link. List trả `runStatus` nếu đã Start.
- `POST /api/cases/:id/proposal`: nhận context đã lưu, trả draft với plan đề xuất; không tự chạy.
- `POST /api/cases/:id/runs`: idempotent theo case; validate và chụp snapshot trước khi chạy. Sau Start, update plan trả 409.
- `GET /api/runs/:id`: trạng thái, taskStates, activeTaskId, artifacts, expert/skill snapshot, trace và exitReason. Frontend poll 700ms khi RUNNING và dừng khi terminal; có thể đổi interval tại hook khi nối execution service.
- `PUT /api/runs/:id/sharing`, `GET /api/shared-cases`, `GET /api/shared-cases/:id`: chỉ nội dung được owner chia sẻ, bao gồm toàn bộ hồ sơ và kết quả.
- `POST /api/documents`: multipart file → nội dung đã trích xuất hoặc trạng thái metadata-only. Demo chỉ đọc TXT/MD/CSV; PDF/DOCX không bị giả vờ là đã đọc.
- `POST /api/experts/:id/messages`: transcript hiện tại và caseId → message của expert; có AbortSignal. Streaming SSE có thể bổ sung sau khi backend chốt contract.
- `GET /api/examples/autosupport`: hồ sơ mẫu chỉ được nạp khi người dùng yêu cầu.

Auth thực, phân quyền theo owner, lưu Lakebase, ingest tài liệu, LangGraph/Delphi, model gateway/OBO, kiểm soát scope/citation và đo token thực thuộc backend giai đoạn tiếp theo. Bộ MSW hiện không thay thế các chức năng này. Các giới hạn 0–5 vòng, tổng 350.000 token và min 100 token/task là contract MVP ban đầu, khai báo trong `PLAN_LIMITS`; cần thống nhất với backend. Ngưỡng dưới 1.000 token gây exit chỉ là tình huống mô phỏng để kiểm tra partial results.

## Xác minh

Build/type-check và lint được chạy bằng script ở trên. Test bao phủ API boundary, auth gate, workspace entry, name dialog, template picker/review, độc lập draft, single-expert chat, validation DAG, snapshot cố định, tiến trình 3 giây/task, partial exit, same-rating dissent, chia sẻ/thu hồi và phục hồi lỗi lưu/gửi.

Chrome DevTools được dùng để chạy luồng template thực tế và kiểm tra viewport planning/results 1366×768, cũng như các panel ở kích thước nhỏ. Các quyết định và kiểm tra chi tiết được ghi ở `VERIFICATION.md`.
