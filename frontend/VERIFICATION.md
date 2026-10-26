# Verification — React MVP1

Ngày kiểm tra: 2026-10-26. Node.js 24.22.1, Windows PowerShell, Chromium qua Chrome DevTools.

## Tooling — baseline trước cập nhật luồng chat

- `npm run lint`: pass, không warning.
- `npm run build`: TypeScript strict và Vite production build pass.
- `npm run build:demo`: pass; chạy được bằng `npm run preview` tại cổng 5174, bao gồm MSW.
- `npm run test:coverage -- --reporter=dot`: **14 test pass, 4 file**. LCOV xuất tại `coverage/lcov.info`; HTML tại `coverage/lcov-report/index.html`.
- Coverage cho phạm vi cấu hình components/hooks/utils: statements/lines 60,24%; branches 69,04%; functions 56,09%. Chưa đặt ngưỡng coverage. Đây không phải tuyên bố mọi nhánh UI đã được kiểm tra tự động.
- Mã React được định dạng bằng Prettier. Không có import trực tiếp fixture/mock trong pages, components hoặc hooks; không nhúng lại HTML prototype qua innerHTML.

## Kiểm tra tự động — baseline trước cập nhật luồng chat

- DAG cycle, missing dependency, giới hạn trao đổi, token budget và bố trí tầng theo dependencies.
- Mỗi task commit ở mốc 3 giây trong mock clock; terminal sau bốn task; giữ snapshot độc lập với chỉnh sửa nguồn về sau.
- Exit tại task thiếu ngân sách mô phỏng: giữ artifacts trước đó, đánh dấu task lỗi và các task downstream chưa chạy.
- Bất đồng có cấu trúc vẫn xuất hiện khi hai expert có cùng rating.
- Không tái sử dụng mã task đang được giữ để Undo.
- API tạo draft tách biệt; validation error có status và message; Start idempotent; chỉnh plan sau Start trả 409.
- Share/revoke qua network mock: full plan, kết quả và expert snapshot được giữ; thu hồi thì public endpoint trả 404.
- Auth lỗi không mount route ứng dụng.
- Popup tên case trước lựa chọn, template đi thẳng tới review plan.
- Chỉ một expert được chọn; tin nhắn đi qua API adapter và lịch sử riêng.
- Form expert được giữ khi điều hướng, xóa recovery khi Hủy và không sửa dữ liệu server ngoài ý muốn.
- Case save lỗi giữ nội dung đang chỉnh và recovery; lưu lại sau khi API phục hồi hoạt động.
- Tin nhắn chưa có phản hồi sau reload có đường thử lại.

## Kiểm tra trình duyệt

- Development, 1366×768: mở template plan, Start từ nút giao diện, theo dõi DAG chỉ đọc và tự chuyển dashboard sau khoảng 12 giây.
- Planning/results ở 1366×768: document height bằng viewport height; không tràn ngang. Inspector task và thông tin case cuộn nội bộ. Layout containment ngăn transformed graph làm tràn trang ngoài.
- Results hiển thị participants, finding/dissent nodes, expert feed và inspector. Sau điều chỉnh khoảng cách, các nhánh của case mẫu nằm trọn trong panel desktop.
- Results ở 375×812: không tràn ngang/dọc ngoài viewport; có tab Bản đồ/Chi tiết/Chuyên gia. Nhánh luận điểm được xếp dọc có kết nối để đọc được trên điện thoại; chọn nhánh mở panel chi tiết.
- Static demo, 1366×768: MSW bootstrap, auth gate và API tạo case hoạt động khi không có backend.
- Static demo: STAR → chọn/bỏ qua case tương tự → đề xuất plan → sửa tên task → quay lại bước 2 → tiến lên bước 3. Tên task đã sửa được giữ, không tự tạo lại plan. Bước 4 là review chỉ đọc và có nút quay lại chỉnh plan.
- Không ghi nhận JavaScript console error trong các luồng browser được kiểm tra ở trên.

## Phạm vi

Các kiểm tra trên xác nhận frontend và API boundary với mock. Chưa xác nhận backend thật, auth/owner policy, model/OBO, ingest PDF/DOCX, LangGraph, token accounting hoặc hiệu quả thẩm định của agent. Các tính năng đó không được mô phỏng thành một tích hợp thật trong bản React này.

## Cập nhật danh mục expert và trao đổi riêng

- Danh mục chỉ đọc: bỏ form tạo/chỉnh sửa expert, hook mutation và recovery của form cũ. URL tạo/chỉnh sửa cũ chuyển về danh sách. Nội dung welcome phản ánh chức năng khám phá chuyên gia.
- ExpertCard được dùng chung ở hai entry point: tên liên kết tới hồ sơ; mô tả, tối đa ba nhãn kỹ năng và một nút Trao đổi riêng. Không có radio/select mode, trạng thái đã chọn, nút Mới hoặc thanh xác nhận.
- Từ danh sách/hồ sơ expert: đặt tên case rồi vào chat. Từ case có tên: bấm hành động trên thẻ để vào chat ngay. Hồ sơ mở từ picker giữ đường quay lại case đó.
- Case lưu thành công mới publish conversation vào store. Nếu lưu thất bại sau khi tạo draft, retry dùng lại draft đó; không tạo thêm case hoặc chat. Mỗi case dùng một conversation; hai vấn đề với cùng expert tạo hai case độc lập.
- Chat một cột với log cuộn nội bộ và composer phía dưới; bỏ panel chuyên gia, system instructions và nút đổi expert. Enter gửi, Shift+Enter xuống dòng; giữ IME, pending/error/retry/abort và khôi phục tin nhắn chưa có phản hồi.
- `npm test`: **18 test pass, 5 file**. Thay test form expert đã bỏ bằng kiểm tra redirect/read-only. Thêm kiểm tra hai entry point, giữ context khi xem hồ sơ, hai case cùng expert, tiếp tục chat từ lịch sử, retry lưu case không trùng, xuống dòng và retry gửi tin nhắn. Các tỷ lệ coverage ở baseline phía trên chưa được đo lại cho cập nhật này.
- `npm run lint` và `npm run build`: pass sau thay đổi mã.
- Chromium development 1366×768: xem trực quan danh sách chuyên gia; bấm Trao đổi riêng, đặt tên case và vào chat đúng chuyên gia. Chat document 1366×768, không overflow bên ngoài; textarea nằm trong viewport.
- Chromium mobile 375×812: gửi tin nhắn và nhận phản hồi qua MSW, kiểm tra screenshot chat; document 375×812, không tràn ngang/dọc bên ngoài, textarea và nút gửi vẫn nằm trong viewport.
- Phản hồi vẫn là mock; chưa nối model hoặc backend lưu lịch sử hội thoại.

## Cập nhật workspace và thứ tự tạo case

- Welcome giữ hai nhánh. Cases hiển thị ba hành động ngay phía trên lịch sử: Dùng template, Thảo luận theo chủ đề, Trao đổi riêng; không còn bước tạo case chung trước khi chọn cách làm.
- Template: chọn Dùng template → đặt tên → thư viện riêng `/cases/:id/templates` → review plan. Giữ tìm kiếm/lọc/sắp xếp/phân trang; bản nháp chưa có template trở lại thư viện khi mở từ lịch sử. Chọn lại cùng template không xóa chỉnh sửa; đổi template khác có xác nhận.
- Theo chủ đề: chọn hình thức → đặt tên → vào bước 1 của wizard. Trao đổi riêng: chọn expert → đặt tên → chat; từ hồ sơ expert và workspace dùng cùng hành vi.
- Dùng case chia sẻ làm context dẫn về workspace để chọn cách làm; reference được giữ qua chọn expert và mở hồ sơ. Hủy hộp đặt tên không tạo case. Các URL `/start` cũ được redirect; draft cũ chưa có method được tiếp tục trên workspace và dùng lại case đã đặt tên.
- POST tạo case nhận thêm method để persist hình thức ngay khi đặt tên, không cần lưu bổ sung trước khi đến bước tiếp theo. Backend thật cần hỗ trợ trường này.
- `npm test`: **24 test pass, 6 file**. Thêm coverage hành vi cho ba entry point, hủy tạo, chọn expert trước khi đặt tên, reference context, resume draft, URL cũ, template search/pagination, retry lưu và bảo toàn chỉnh sửa. Không đo lại tỷ lệ coverage baseline.
- Browser development 1366×768: nhìn trực tiếp workspace; Dùng template → popup tên → thư viện → review plan hoạt động đúng. Review giữ tên case, document 1366×768 không overflow ngoài viewport.
- Mobile 375×812: kiểm tra screenshot workspace sau khi thu gọn thẻ; ba hành động nằm trong khoảng y=236–709, không tràn ngang (document width 375). Trang lịch sử cuộn bình thường. Lint, format và demo build pass sau cập nhật.

## Loading và ổn định màn hình pipeline

- Spinner ở nút khởi chạy, trạng thái pipeline, node DAG và phần đầu ra task đang chạy; tắt chuyển động theo prefers-reduced-motion.
- Skeleton tải pipeline giữ khung DAG/chi tiết/tiến trình. Suspense nằm trong AppShell để thanh điều hướng không biến mất khi tải route.
- Background refetch không thay toàn bộ DAG bằng màn hình lỗi khi đã có dữ liệu; hiện cảnh báo gọn trong hàng cố định, giữ snapshot gần nhất và cho phép Thử lại. Giữ node được chọn và zoom thủ công.
- Dành chỗ cho trạng thái và sự kiện, dùng số có chiều rộng ổn định, giới hạn cuộn bên trong panel và tắt scroll anchoring tại nội dung cập nhật. Khung chạy ưu tiên diện tích DAG trên desktop.
- Khi chạy xong, hiện thông báo chuyển tiếp 700ms, preload chunk kết quả và tự mở dashboard. Không thêm thời gian vào task hoặc sửa logic execution.
- `npm test`: **27 test pass, 7 file**. Thêm kiểm tra navigation shell khi request đầu còn pending, DOM DAG/selection/zoom qua refetch và API error/recovery, thông báo hoàn tất trước dashboard. Các kiểm tra API dùng MSW; chưa đo lại coverage baseline.
- Browser 1366×768: khởi chạy plan mẫu từ UI, xác nhận spinner và chuyển kết quả tự động. Lấy tám mẫu DOM qua nhiều lần polling và thay đổi tiến trình 0% → 25%: document giữ height 768, vùng pipeline giữ nguyên vị trí/kích thước trong toàn bộ mẫu.

## Ba bộ sưu tập case và Library

- Gộp case thảo luận và trao đổi riêng vào Case của tôi; join theo caseId/chatId, giữ chat legacy không có server case, cập nhật thời gian theo tin nhắn gần nhất. Không còn tab Trao đổi riêng hoặc Đã chia sẻ.
- Hai bộ sưu tập còn lại: Case được share với tôi (restricted, recipient hiện tại, owner khác) và Library (public). Query key/list API phân biệt collection; full detail chỉ đọc vẫn mở được theo quyền truy cập tương ứng.
- Library theo bố cục filter / grid-list / detail panel. Có domain, expert, decision type, time, search, sort, reset và empty state. Detail có STAR, participants, summary, kết quả, quy trình, tài liệu, dùng làm context và mở full case.
- Mock có 6 public và 2 received; migration giữ draft/run/chat cũ. Publish từ results đưa snapshot vào Library, không vào received. Backend thật còn cần thực thi authorization và quản lý grant.
- `npm test -- --maxWorkers=2`: **33 test pass, 8 file**. Thêm 6 test cho unified history/dedup/search/resume, collection separation và inaccessible detail 404, library filters/grid-list/documents/context, received return link, time/empty reset và legacy ordering. API test kiểm tra publish xuất hiện đúng collection.
- Sửa matchMedia polyfill của test thành hàm thường để không bị restoreMocks xóa implementation giữa các test. Giới hạn hai worker khi chạy full suite trên máy hiện tại để tránh timeout khi nhiều jsdom/transform chạy cùng lúc. Không đo lại coverage baseline.
- Browser 1440×900: kiểm tra screenshot Library, panel detail có footer CTA trong viewport; document không tràn ngang. Mobile 375×812: không tràn ngang, bộ lọc thu gọn, chọn case đưa focus tới detail; detail trong y=24–792, CTA vẫn nhìn thấy. Chuyển received chỉ hiển thị restricted fixtures, không có public case.
