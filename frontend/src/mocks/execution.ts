import type {
  CaseDraft,
  Expert,
  Rating,
  Run,
  Skill,
  Task,
  TaskResult,
  TaskStatus,
  TraceEvent,
} from '@/types';
import { topologicalTasks } from '@/utils/plan';

export const MOCK_TASK_MS = 3000;
export function createMockRun(
  draft: CaseDraft,
  experts: Expert[],
  skills: Skill[],
  now = Date.now(),
): Run {
  const expertIds = new Set(draft.tasks.flatMap((t) => t.expertIds));
  return {
    id: `run-${crypto.randomUUID()}`,
    caseId: draft.id,
    title: draft.title,
    status: 'RUNNING',
    startedAt: new Date(now).toISOString(),
    finishedAt: null,
    plan: structuredClone(draft),
    experts: structuredClone(experts.filter((e) => expertIds.has(e.id))),
    skills: structuredClone(skills),
    taskStates: {},
    activeTaskId: null,
    results: [],
    trace: [],
    exitReason: null,
    shared: false,
    mock: true,
  };
}
function resultFor(task: Task, plan: CaseDraft): TaskResult {
  const risk = plan.templateId === 'ai-risk',
    index = plan.tasks.findIndex((t) => t.id === task.id);
  const rating: Rating | undefined = risk ? (index === 1 ? 'MODERATE' : 'HIGH') : undefined;
  const documents = plan.documents.filter(
    (d) => d.status === 'ready' && (d.kind === 'case' || task.documentIds.includes(d.id)),
  );
  const evidence = documents.slice(0, 2).map((d) => ({
    documentId: d.id,
    section: 'Toàn văn được cấp',
    quote: d.content.split('\n').find((line) => line.includes('§')) || d.content.slice(0, 180),
  }));
  const views = task.expertIds.map((id, i) => ({
    expertId: id,
    initialRating: rating && i === 0 && index === 0 ? ('MODERATE' as Rating) : rating,
    finalRating: rating && i === 0 && index === 0 ? ('MODERATE' as Rating) : rating,
    text: `Nhận định mô phỏng cho “${task.title}”: ${i === 0 ? 'cần kiểm chứng các giả định và điều kiện áp dụng' : 'ưu tiên kiểm soát trước khi mở rộng phạm vi'}. Chỉ có thể đối chiếu ${documents.length} tài liệu được cấp; đây chưa phải đánh giá từ model.`,
  }));
  const disagreements =
    task.expertIds.length > 1
      ? [
          {
            aspect:
              index === 0 && risk ? 'Mức rủi ro và giả định kiểm soát' : 'Thứ tự ưu tiên biện pháp',
            expertAId: task.expertIds[0],
            expertAView: 'Ưu tiên kiểm thử và xác nhận giả định trước.',
            expertBId: task.expertIds[1],
            expertBView: 'Ưu tiên bổ sung kiểm soát trước khi pilot.',
            resolutionNote: 'Giữ cả hai quan điểm; không ép đồng thuận khi hết số vòng.',
          },
        ]
      : [];
  const summary = `Kết quả mô phỏng · ${task.title}. Đầu ra cần đạt: ${task.output} Các nhận định cần được xác minh bằng bằng chứng thực tế.`;
  return {
    taskId: task.id,
    title: task.title,
    summary,
    rating,
    views,
    evidence,
    disagreements,
    upstreamBrief: JSON.stringify(
      {
        task: task.id,
        rating: rating ?? null,
        conclusion: summary,
        openDisagreements: disagreements.map((d) => d.aspect),
        sourceIds: evidence.map((e) => e.documentId),
      },
      null,
      2,
    ),
    mock: true,
  };
}
/** Clock-derived mock execution survives page navigation without frontend job timers. */
export function simulateRun(source: Run, now = Date.now()): Run {
  const run = structuredClone(source),
    ordered = topologicalTasks(run.plan.tasks),
    start = new Date(run.startedAt).getTime();
  run.taskStates = Object.fromEntries(run.plan.tasks.map((t) => [t.id, 'PENDING' as TaskStatus]));
  run.results = [];
  run.trace = [];
  run.activeTaskId = null;
  run.exitReason = null;
  const trace = (offset: number, title: string, detail: string, taskId?: string): TraceEvent => ({
    id: `${run.id}-${run.trace.length}`,
    time: new Date(start + offset).toISOString(),
    type: taskId ? 'task' : 'run',
    title,
    detail,
    taskId,
  });
  run.trace.push(trace(0, 'Cố định bản plan', 'Mô phỏng API: 3 giây/task; không gọi model.'));
  for (const [index, task] of ordered.entries()) {
    const offset = index * MOCK_TASK_MS,
      elapsed = now - start - offset;
    if (elapsed < 0) continue;
    if (task.tokenBudget < 1000) {
      run.status = 'INCOMPLETE';
      run.exitReason = `${task.id}: ngân sách dưới ngưỡng 1.000 token của bộ mô phỏng. Không có phép đo token từ model.`;
      run.taskStates[task.id] = 'FAILED';
      for (const rest of ordered.slice(index + 1)) run.taskStates[rest.id] = 'SKIPPED';
      run.finishedAt = new Date(start + offset).toISOString();
      run.trace.push(trace(offset, 'Thoát có kiểm soát', run.exitReason, task.id));
      return run;
    }
    run.trace.push(
      trace(
        offset,
        'Đánh giá độc lập',
        `${task.expertIds.length} expert; upstream: ${task.dependsOn.join(', ') || 'không có'}.`,
        task.id,
      ),
    );
    if (elapsed >= MOCK_TASK_MS) {
      run.taskStates[task.id] = 'DONE';
      run.results.push(resultFor(task, run.plan));
      run.trace.push(
        trace(
          offset + MOCK_TASK_MS,
          'Commit kết quả & upstream brief',
          'Giữ bất đồng và nguồn; không chuyển toàn bộ hội thoại xuống task sau.',
          task.id,
        ),
      );
    } else {
      run.activeTaskId = task.id;
      run.taskStates[task.id] =
        elapsed < 1000
          ? 'ASSESSING'
          : elapsed < 2000 && task.expertIds.length > 1 && task.reviewMode === 'cross'
            ? 'REVIEWING'
            : 'SYNTHESIZING';
    }
  }
  const completed = run.results.length === ordered.length;
  run.status = completed ? 'COMPLETED' : 'RUNNING';
  run.finishedAt = completed ? new Date(start + ordered.length * MOCK_TASK_MS).toISOString() : null;
  if (completed)
    run.trace.push(
      trace(
        ordered.length * MOCK_TASK_MS,
        'Hoàn tất plan',
        'Kết quả chưa được người thật phê duyệt.',
      ),
    );
  return run;
}
