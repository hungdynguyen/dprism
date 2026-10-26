import { delay, http, HttpResponse } from 'msw';
import type {
  CaseDraft,
  CaseMethod,
  ChatMessage,
  ExpertInput,
  PlanDocument,
  PlanTemplate,
} from '@/types';
import { blankCase, db, persistMockDatabase } from '@/mocks/database';
import {
  riskTasks,
  referenceDocuments,
  sampleContext,
  sampleDocument,
  skills,
} from '@/mocks/fixtures';
import { createMockRun, simulateRun } from '@/mocks/execution';
import { validateCase } from '@/utils/plan';

const fail = (detail: string, status = 404) => HttpResponse.json({ detail }, { status });
const wait = () => delay(import.meta.env.MODE === 'test' ? 0 : 120);
export const handlers = [
  http.get('/api/users/me', async () => {
    await wait();
    return HttpResponse.json({ id: 'tran', name: 'Tran', capabilities: { appEnabled: true } });
  }),
  http.get('/api/examples/autosupport', () =>
    HttpResponse.json({ context: sampleContext, document: sampleDocument }),
  ),
  http.get('/api/experts', async () => {
    await wait();
    return HttpResponse.json(db.experts);
  }),
  http.get('/api/experts/:id', ({ params }) => {
    const item = db.experts.find((e) => e.id === params.id);
    return item ? HttpResponse.json(item) : fail('Không tìm thấy expert.');
  }),
  http.post('/api/experts', async ({ request }) => {
    const data = (await request.json()) as ExpertInput;
    if (!data.role.trim() || !data.approach.trim())
      return fail('Vai trò và cách đánh giá là bắt buộc.', 400);
    const item = { ...data, id: `expert-${crypto.randomUUID()}` };
    db.experts.push(item);
    persistMockDatabase();
    return HttpResponse.json(item, { status: 201 });
  }),
  http.put('/api/experts/:id', async ({ params, request }) => {
    const index = db.experts.findIndex((e) => e.id === params.id);
    if (index < 0) return fail('Không tìm thấy expert.');
    const data = (await request.json()) as ExpertInput;
    if (!data.role.trim() || !data.approach.trim())
      return fail('Vai trò và cách đánh giá là bắt buộc.', 400);
    db.experts[index] = { ...data, id: String(params.id) };
    persistMockDatabase();
    return HttpResponse.json(db.experts[index]);
  }),
  http.get('/api/skills', () => HttpResponse.json(skills)),
  http.get('/api/templates', () => HttpResponse.json(db.templates)),
  http.post('/api/templates', async ({ request }) => {
    const data = (await request.json()) as Omit<PlanTemplate, 'id' | 'version'>;
    if (!data.title.trim() || !data.tasks.length)
      return fail('Template cần tên và ít nhất một task.', 400);
    const item = { ...data, id: `template-${crypto.randomUUID()}`, version: '1.0.0' };
    db.templates.push(item);
    persistMockDatabase();
    return HttpResponse.json(item, { status: 201 });
  }),
  http.get('/api/cases', async () => {
    await wait();
    return HttpResponse.json(
      db.cases.map((c) => {
        const run = db.runs.find((r) => r.id === c.runId);
        return { ...c, runStatus: run ? simulateRun(run).status : undefined };
      }),
    );
  }),
  http.get('/api/cases/:id', ({ params }) => {
    const item = db.cases.find((c) => c.id === params.id);
    return item ? HttpResponse.json(item) : fail('Không tìm thấy case.');
  }),
  http.post('/api/cases', async ({ request }) => {
    const data = (await request.json()) as {
      title: string;
      referenceCaseIds?: string[];
      method?: CaseMethod;
    };
    if (!data.title.trim()) return fail('Nhập tên case.', 400);
    if (data.method && !['template', 'open', 'direct'].includes(data.method))
      return fail('Hình thức case không hợp lệ.', 400);
    const item = blankCase(data.title.trim());
    item.referenceCaseIds = data.referenceCaseIds || [];
    item.method = data.method || null;
    db.cases.unshift(item);
    persistMockDatabase();
    return HttpResponse.json(item, { status: 201 });
  }),
  http.put('/api/cases/:id', async ({ params, request }) => {
    const index = db.cases.findIndex((c) => c.id === params.id);
    if (index < 0) return fail('Không tìm thấy case.');
    if (db.cases[index].runId) return fail('Plan đã cố định sau khi bắt đầu.', 409);
    const data = (await request.json()) as CaseDraft;
    if (data.revision < db.cases[index].revision)
      return fail('Bản chỉnh sửa đã cũ. Tải lại case để tiếp tục.', 409);
    db.cases[index] = { ...data, id: String(params.id), updatedAt: new Date().toISOString() };
    persistMockDatabase();
    return HttpResponse.json(db.cases[index]);
  }),
  http.post('/api/cases/:id/proposal', ({ params }) => {
    const item = db.cases.find((c) => c.id === params.id);
    if (!item) return fail('Không tìm thấy case.');
    if (item.runId) return fail('Case đang chạy không thể tạo lại plan.', 409);
    item.tasks = riskTasks();
    item.documents = [
      ...item.documents.filter((d) => d.kind === 'case'),
      ...structuredClone(referenceDocuments),
    ];
    item.templateId = null;
    item.revision++;
    persistMockDatabase();
    return HttpResponse.json(item);
  }),
  http.post('/api/cases/:id/runs', ({ params }) => {
    const item = db.cases.find((c) => c.id === params.id);
    if (!item) return fail('Không tìm thấy case.');
    if (item.runId) {
      const existing = db.runs.find((r) => r.id === item.runId);
      return existing
        ? HttpResponse.json(simulateRun(existing))
        : fail('Không tìm thấy phiên chạy.');
    }
    const issue = validateCase(item)[0];
    if (issue) return fail(issue.message, 400);
    if (item.tasks.some((t) => t.expertIds.some((id) => !db.experts.some((e) => e.id === id))))
      return fail('Plan tham chiếu expert không còn tồn tại.', 400);
    const run = createMockRun(item, db.experts, skills);
    item.runId = run.id;
    run.plan.runId = run.id;
    db.runs.push(run);
    persistMockDatabase();
    return HttpResponse.json(simulateRun(run), { status: 201 });
  }),
  http.get('/api/runs/:id', ({ params }) => {
    const run = db.runs.find((r) => r.id === params.id);
    return run ? HttpResponse.json(simulateRun(run)) : fail('Không tìm thấy phiên chạy.');
  }),
  http.put('/api/runs/:id/sharing', async ({ params, request }) => {
    const run = db.runs.find((r) => r.id === params.id);
    if (!run) return fail('Không tìm thấy phiên chạy.');
    const data = (await request.json()) as { shared: boolean };
    run.shared = data.shared;
    const snapshot = simulateRun(run);
    db.shared = db.shared.filter((s) => s.id !== run.id);
    if (data.shared)
      db.shared.push({
        id: run.id,
        title: run.title,
        owner: 'Tran',
        summary: 'Toàn bộ plan, tài liệu, ý kiến expert và trace.',
        publishedAt: new Date().toISOString(),
        run: snapshot,
      });
    persistMockDatabase();
    return HttpResponse.json(snapshot);
  }),
  http.get('/api/shared-cases', () => HttpResponse.json(db.shared)),
  http.get('/api/shared-cases/:id', ({ params }) => {
    const item = db.shared.find((c) => c.id === params.id);
    return item ? HttpResponse.json(item) : fail('Case chưa được chia sẻ hoặc đã thu hồi.');
  }),
  http.post('/api/documents', async ({ request }) => {
    const form = await request.formData(),
      file = form.get('file');
    if (!file || typeof file === 'string') return fail('Chọn tài liệu để tải lên.', 400);
    if (file.size > 10 * 1024 * 1024) return fail('Mỗi tài liệu tối đa 10 MB.', 400);
    const ready = /\.(txt|md|csv)$/i.test(file.name);
    const item: PlanDocument = {
      id: `doc-${crypto.randomUUID()}`,
      name: file.name,
      kind: 'case',
      content: ready ? await file.text() : '',
      status: ready ? 'ready' : 'metadata-only',
      mime: file.type,
      size: file.size,
    };
    return HttpResponse.json(item, { status: 201 });
  }),
  http.post('/api/experts/:id/messages', async ({ params, request }) => {
    const expert = db.experts.find((e) => e.id === params.id);
    if (!expert) return fail('Không tìm thấy expert.');
    const data = (await request.json()) as { messages: ChatMessage[] };
    await delay(import.meta.env.MODE === 'test' ? 0 : 800);
    const last = [...data.messages].reverse().find((m) => m.role === 'user');
    return HttpResponse.json({
      id: `message-${crypto.randomUUID()}`,
      role: 'assistant',
      content: `**Phản hồi mô phỏng · ${expert.role}**\n\nVới câu hỏi “${last?.content.slice(0, 180) || ''}”, cách tiếp cận của tôi là:\n\n${expert.approach}\n\nHãy làm rõ mục tiêu, giả định và bằng chứng hiện có trước khi đưa ra kết luận. Nội dung này chưa được model phân tích.`,
      createdAt: new Date().toISOString(),
      mock: true,
    } satisfies ChatMessage);
  }),
];
