import type { CaseDraft, Task, ValidationIssue } from '@/types';

/** Initial MVP contract; execution service must enforce these limits independently. */
export const PLAN_LIMITS = { maxRounds: 5, minTaskTokens: 100, maxTotalTokens: 350000 } as const;

export function topologicalTasks(tasks: Task[]): Task[] {
  const done = new Set<string>(),
    ordered: Task[] = [];
  while (ordered.length < tasks.length) {
    const ready = tasks.find((t) => !done.has(t.id) && t.dependsOn.every((id) => done.has(id)));
    if (!ready) break;
    ordered.push(ready);
    done.add(ready.id);
  }
  return ordered;
}
export function validateCase(draft: CaseDraft, contextOnly = false): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!draft.title.trim()) errors.push({ field: 'case-title', message: 'Nhập tên case.' });
  if (!draft.context.task.trim())
    errors.push({ field: 'case-objective', message: 'Mô tả mục tiêu cần giải quyết.' });
  if (!draft.output.trim())
    errors.push({ field: 'case-output', message: 'Xác định đầu ra mong muốn.' });
  if (contextOnly) return errors;
  if (!draft.tasks.length)
    errors.push({ field: 'case-title', message: 'Plan cần ít nhất một task.' });
  const ids = new Set(draft.tasks.map((t) => t.id));
  if (ids.size !== draft.tasks.length)
    errors.push({ field: 'task-title', message: 'Mã task không được trùng.' });
  for (const task of draft.tasks) errors.push(...validateTask(task, ids));
  if (
    topologicalTasks(draft.tasks).length !== draft.tasks.length &&
    !errors.some((e) => e.field === 'task-dependencies')
  )
    errors.push({
      field: 'task-dependencies',
      taskId: draft.tasks[0]?.id,
      message: 'DAG có chu trình. Bỏ một liên kết phụ thuộc.',
    });
  if (draft.tasks.reduce((sum, t) => sum + t.tokenBudget, 0) > PLAN_LIMITS.maxTotalTokens)
    errors.push({
      field: 'task-budget',
      message: 'Tổng ngân sách plan không được vượt 350.000 token.',
    });
  return errors;
}
function validateTask(task: Task, ids: Set<string>): ValidationIssue[] {
  const errors: ValidationIssue[] = [],
    add = (field: string, message: string) =>
      errors.push({ field, taskId: task.id, message: `${task.id} · ${message}` });
  if (!task.title.trim()) add('task-title', 'Nhập tên task.');
  if (!task.instruction.trim()) add('task-instruction', 'Nhập hướng dẫn thực hiện.');
  if (!task.output.trim()) add('task-output', 'Xác định đầu ra.');
  if (!task.expertIds.length) add('task-experts', 'Chọn ít nhất một expert.');
  if (task.dependsOn.some((id) => id === task.id || !ids.has(id)))
    add('task-dependencies', 'Sửa liên kết phụ thuộc bị thiếu hoặc trỏ về chính task.');
  const minimum = task.reviewMode === 'cross' && task.expertIds.length > 1 ? 1 : 0;
  if (
    !Number.isInteger(task.maxRounds) ||
    task.maxRounds < minimum ||
    task.maxRounds > PLAN_LIMITS.maxRounds
  )
    add('task-rounds', `Số vòng cần từ ${minimum} đến ${PLAN_LIMITS.maxRounds}.`);
  if (
    !Number.isInteger(task.tokenBudget) ||
    task.tokenBudget < PLAN_LIMITS.minTaskTokens ||
    task.tokenBudget > PLAN_LIMITS.maxTotalTokens
  )
    add('task-budget', 'Ngân sách cần từ 100 đến 350.000 token.');
  return errors;
}
export function nextTask(tasks: Task[], reservedIds: string[] = []): Task {
  let n = 1;
  while (tasks.some((t) => t.id === `C${n}`) || reservedIds.includes(`C${n}`)) n++;
  return {
    id: `C${n}`,
    title: 'Task mới',
    dependsOn: [],
    expertIds: [],
    instruction: '',
    output: '',
    documentIds: [],
    reviewMode: 'cross',
    maxRounds: 1,
    tokenBudget: 10000,
  };
}
export function graphLayout(tasks: Task[]) {
  const ordered = topologicalTasks(tasks),
    levels = new Map<string, number>();
  for (const task of ordered)
    levels.set(task.id, Math.max(-1, ...task.dependsOn.map((id) => levels.get(id) ?? -1)) + 1);
  const rows = new Map<number, number>();
  const nodes = tasks.map((task) => {
    const level = levels.get(task.id) ?? 0,
      row = rows.get(level) ?? 0;
    rows.set(level, row + 1);
    return { task, x: 36 + level * 290, y: 40 + row * 134 };
  });
  return {
    nodes,
    width: Math.max(620, ...nodes.map((n) => n.x + 280)),
    height: Math.max(260, ...nodes.map((n) => n.y + 140)),
  };
}
