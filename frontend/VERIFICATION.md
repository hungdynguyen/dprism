# Verification — React MVP1

Ngày kiểm tra: 2026-10-26. Node.js 24.22.1, Windows PowerShell, Chromium qua Chrome DevTools.

## Tooling

- `npm run lint`: pass, không warning.
- `npm run build`: TypeScript strict và Vite production build pass.
- `npm run build:demo`: pass; chạy được bằng `npm run preview` tại cổng 5174, bao gồm MSW.
- `npm run test:coverage -- --reporter=dot`: **14 test pass, 4 file**. LCOV xuất tại `coverage/lcov.info`; HTML tại `coverage/lcov-report/index.html`.
- Coverage cho phạm vi cấu hình components/hooks/utils: statements/lines 60,24%; branches 69,04%; functions 56,09%. Chưa đặt ngưỡng coverage. Đây không phải tuyên bố mọi nhánh UI đã được kiểm tra tự động.
- Mã React được định dạng bằng Prettier. Không có import trực tiếp fixture/mock trong pages, components hoặc hooks; không nhúng lại HTML prototype qua innerHTML.

## Kiểm tra tự động

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
