import type { CaseContext, Expert, PlanDocument, PlanTemplate, Skill, Task } from '@/types';

export const skills: Skill[] = [
  {
    id: 'ai-risk',
    name: 'Đánh giá rủi ro AI',
    description: 'Use when assessing an AI use case.',
    content:
      '# Đánh giá rủi ro AI\n\nUse when assessing an AI use case.\n\n1. Xác định tài sản, luồng dữ liệu và giả định.\n2. Đối chiếu từng phát hiện với bằng chứng.\n3. Nêu mức rủi ro và điều kiện làm thay đổi nhận định.',
  },
  {
    id: 'threat',
    name: 'Threat modeling',
    description: 'Use when reviewing trust boundaries and tool permissions.',
    content:
      '# Threat modeling\n\nUse when reviewing trust boundaries and tool permissions.\n\nLiệt kê tài sản, chủ thể tấn công, đường khai thác, tác động và kiểm soát còn thiếu.',
  },
  {
    id: 'data',
    name: 'Đánh giá dữ liệu',
    description: 'Use when reviewing data handling.',
    content:
      '# Đánh giá dữ liệu\n\nUse when reviewing data handling.\n\nKiểm tra loại dữ liệu, quyền truy cập, mục đích sử dụng, thời gian lưu giữ và chứng cứ kiểm soát.',
  },
  {
    id: 'review',
    name: 'Phản biện dựa trên bằng chứng',
    description: 'Use when reviewing an anonymous peer assessment.',
    content:
      '# Phản biện dựa trên bằng chứng\n\nUse when reviewing an anonymous peer assessment.\n\nĐối chiếu bằng chứng, nêu điểm đồng ý hoặc phản đối. Giữ hoặc sửa nhận định kèm lý do; không bắt buộc đồng thuận.',
  },
  {
    id: 'synthesis',
    name: 'Tổng hợp bảo tồn bất đồng',
    description: 'Use when assembling independent assessments.',
    content:
      '# Tổng hợp bảo tồn bất đồng\n\nUse when assembling independent assessments.\n\nGiữ nguyên ý kiến gốc. Tách kết luận, bất đồng, nguồn và các giới hạn. Không bổ sung bằng chứng không có trong hồ sơ.',
  },
];
export const experts: Expert[] = [
  {
    id: 'safety',
    role: 'AI Safety Expert',
    domain: 'AI & Data',
    approach:
      'Kiểm tra giả định, tìm tình huống đối kháng và ưu tiên bằng chứng có thể kiểm chứng.',
    systemPrompt:
      'Đánh giá an toàn hệ thống AI trong phạm vi được giao. Phân biệt bằng chứng và giả định; chỉ trích dẫn tài liệu được cấp.',
    skillIds: ['ai-risk', 'review'],
  },
  {
    id: 'security',
    role: 'Security Expert',
    domain: 'Security',
    approach: 'Tư duy threat modeling; xem xét quyền hạn, ranh giới tin cậy và đường tấn công.',
    systemPrompt:
      'Đánh giá prompt injection, quyền truy cập và thực thi công cụ. Nêu điều kiện khai thác, bằng chứng và biện pháp giảm thiểu.',
    skillIds: ['threat', 'review'],
  },
  {
    id: 'legal',
    role: 'Data Compliance Expert',
    domain: 'Compliance',
    approach: 'Đối chiếu dữ liệu đầu vào, chính sách nội bộ và các điều kiện áp dụng.',
    systemPrompt:
      'Đánh giá quy trình dữ liệu theo chính sách được cung cấp. Không khẳng định tuân thủ khi thiếu tài liệu và căn cứ.',
    skillIds: ['data', 'review'],
  },
  {
    id: 'operations',
    role: 'Operations Expert',
    domain: 'Operations',
    approach: 'Ưu tiên tính vận hành được, khả năng kiểm soát và tác động khi có lỗi.',
    systemPrompt: 'Đánh giá sự cố, quyền công cụ, logging và trách nhiệm vận hành dựa trên hồ sơ.',
    skillIds: ['threat'],
  },
  {
    id: 'synthesizer',
    role: 'Synthesis Expert',
    domain: 'Synthesis',
    approach: 'Tổng hợp trung lập, làm rõ điểm đồng thuận và giữ nguyên bất đồng.',
    systemPrompt:
      'Tổng hợp các đánh giá đã hoàn thành. Giữ ý kiến gốc, bằng chứng và giới hạn; không bắt buộc thống nhất.',
    skillIds: ['synthesis'],
  },
];
export const referenceDocuments: PlanDocument[] = [
  {
    id: 'D2',
    name: 'SEC-04 · Quy trình kiểm soát AI',
    kind: 'reference',
    status: 'ready',
    content:
      '[§1] Nội dung không tin cậy không được thay đổi chính sách hoặc quyền thực thi.\n[§2] Quyền truy cập công cụ phải gắn với người dùng cuối và nguyên tắc tối thiểu.\n[§3] Mỗi đánh giá phải có bằng chứng, giới hạn và biện pháp giảm thiểu.',
  },
  {
    id: 'D3',
    name: 'DATA-02 · Chính sách xử lý dữ liệu',
    kind: 'reference',
    status: 'ready',
    content:
      '[§1] Ghi nhận mục đích xử lý và nhóm dữ liệu được phép.\n[§2] Che dữ liệu nhạy cảm trước khi ghi log.\n[§3] Hồ sơ phải quy định thời gian lưu giữ và cơ chế xóa.',
  },
];
export const sampleDocument: PlanDocument = {
  id: 'D1',
  name: 'AutoSupport · Hồ sơ hệ thống',
  kind: 'case',
  status: 'ready',
  content:
    '# Hồ sơ AutoSupport\n\n[§1] Trợ lý AI nhận nội dung từ khách hàng và tài liệu đính kèm; chưa tách nội dung không tin cậy khỏi chỉ dẫn hệ thống.\n[§2] Kết quả truy vấn có thể chứa dữ liệu nhận diện khách hàng.\n[§3] Công cụ tra cứu hiện dùng service account có quyền dùng chung.',
};
export const sampleContext: CaseContext = {
  situation:
    'Ngân hàng chuẩn bị pilot AutoSupport, trợ lý AI hỗ trợ khách hàng và tra cứu giao dịch.',
  task: 'Đánh giá điều kiện an toàn trước khi pilot với dữ liệu khách hàng.',
  action:
    'Đọc hồ sơ, đối chiếu chính sách và đánh giá độc lập; cân nhắc cô lập nội dung và giới hạn quyền công cụ.',
  result: 'Bảng rủi ro có bằng chứng, bất đồng và biện pháp cần hoàn thành trước pilot.',
};
export const riskTasks = (): Task[] => [
  {
    id: 'C1',
    title: 'Prompt injection & an toàn AI',
    dependsOn: [],
    expertIds: ['safety', 'security'],
    instruction:
      'Đánh giá nội dung không tin cậy, ranh giới chỉ dẫn và khả năng thao túng truy xuất.',
    output: 'Rating, phát hiện, bằng chứng và biện pháp giảm thiểu.',
    documentIds: ['D2'],
    reviewMode: 'cross',
    maxRounds: 2,
    tokenBudget: 16000,
  },
  {
    id: 'C2',
    title: 'Quyền riêng tư & dữ liệu',
    dependsOn: ['C1'],
    expertIds: ['legal', 'safety'],
    instruction:
      'Đối chiếu luồng dữ liệu với DATA-02. Dùng brief C1 để xem xét nguy cơ lộ thông tin.',
    output: 'Bảng rủi ro dữ liệu kèm nguồn tham khảo.',
    documentIds: ['D3'],
    reviewMode: 'cross',
    maxRounds: 1,
    tokenBudget: 12000,
  },
  {
    id: 'C3',
    title: 'Công cụ & kiểm soát vận hành',
    dependsOn: ['C1'],
    expertIds: ['security', 'operations'],
    instruction: 'Đánh giá phân quyền, thực thi công cụ và tác động vận hành dựa trên brief C1.',
    output: 'Phát hiện về công cụ và phương án kiểm soát.',
    documentIds: ['D2'],
    reviewMode: 'cross',
    maxRounds: 2,
    tokenBudget: 14000,
  },
  {
    id: 'C4',
    title: 'Tổng hợp & xuất báo cáo',
    dependsOn: ['C2', 'C3'],
    expertIds: ['synthesizer'],
    instruction: 'Tổng hợp các brief, giữ bất đồng và chỉ rõ phần chưa đủ bằng chứng.',
    output: 'Báo cáo tổng thể, ma trận rủi ro, bất đồng, nguồn và trace.',
    documentIds: [],
    reviewMode: 'single',
    maxRounds: 0,
    tokenBudget: 8000,
  },
];
export const templateFixtures: PlanTemplate[] = [
  {
    id: 'ai-risk',
    title: 'Thẩm định rủi ro hệ thống AI',
    description: 'Đánh giá độc lập, phản biện và tổng hợp rủi ro từ hồ sơ hệ thống.',
    category: 'Thẩm định rủi ro',
    version: '1.0.0',
    output: 'Bảng rủi ro theo cấu phần, executive summary, bằng chứng, bất đồng và trace.',
    tasks: riskTasks(),
    documents: referenceDocuments,
  },
  ...[
    [
      'solution',
      'So sánh phương án triển khai',
      'Ra quyết định',
      'So sánh tính khả thi, chi phí và các trade-off.',
      'Ma trận phương án và khuyến nghị.',
      'operations',
      'safety',
    ],
    [
      'prompt-review',
      'Rà soát Prompt Injection',
      'Bảo mật',
      'Kiểm tra ranh giới chỉ dẫn và nội dung không tin cậy.',
      'Đường tấn công, bằng chứng và kiểm soát cần bổ sung.',
      'safety',
      'security',
    ],
    [
      'data-review',
      'Đánh giá quyền riêng tư dữ liệu',
      'Tuân thủ',
      'Đối chiếu mục đích xử lý, truy cập và lưu giữ dữ liệu.',
      'Khoảng trống chính sách dữ liệu và khuyến nghị.',
      'legal',
      'safety',
    ],
    [
      'tool-permissions',
      'Kiểm tra phân quyền công cụ',
      'Bảo mật',
      'Đánh giá service account và ranh giới thực thi.',
      'Ma trận quyền và biện pháp kiểm soát.',
      'security',
      'operations',
    ],
    [
      'operational-readiness',
      'Sẵn sàng vận hành trước pilot',
      'Vận hành',
      'Rà soát logging, xử lý sự cố và trách nhiệm.',
      'Checklist trước pilot và hành động ưu tiên.',
      'operations',
      'security',
    ],
    [
      'model-governance',
      'Rà soát quản trị mô hình AI',
      'Quản trị AI',
      'Đánh giá giả định, giám sát và phạm vi sử dụng.',
      'Điều kiện sử dụng và kế hoạch theo dõi.',
      'safety',
      'legal',
    ],
    [
      'implementation-options',
      'Lựa chọn phương án kiểm soát',
      'Ra quyết định',
      'So sánh tác động và tính khả thi của các phương án.',
      'Ma trận lựa chọn và quan điểm còn khác biệt.',
      'operations',
      'safety',
    ],
  ].map(
    ([id, title, category, description, output, a, b]): PlanTemplate => ({
      id,
      title,
      category,
      description,
      output,
      version: '1.0.0',
      documents: referenceDocuments,
      tasks: [
        {
          id: 'C1',
          title,
          dependsOn: [],
          expertIds: [a, b],
          instruction: description,
          output: 'Nhận định độc lập và bằng chứng.',
          documentIds: [category === 'Tuân thủ' ? 'D3' : 'D2'],
          reviewMode: 'cross',
          maxRounds: 2,
          tokenBudget: 14000,
        },
        {
          id: 'C2',
          title: 'Đối chiếu bằng chứng & phương án',
          dependsOn: ['C1'],
          expertIds: [a, b],
          instruction: 'Dựa trên brief C1 để phản biện các giả định và phương án xử lý.',
          output: 'Nhận định sau đối chiếu và bất đồng còn mở.',
          documentIds: ['D2'],
          reviewMode: 'cross',
          maxRounds: 1,
          tokenBudget: 12000,
        },
        {
          id: 'C3',
          title: 'Tổng hợp kết quả',
          dependsOn: ['C2'],
          expertIds: ['synthesizer'],
          instruction: 'Tổng hợp kết quả đã hoàn thành, giữ bất đồng và các giới hạn.',
          output,
          documentIds: [],
          reviewMode: 'single',
          maxRounds: 0,
          tokenBudget: 8000,
        },
      ],
    }),
  ),
];
