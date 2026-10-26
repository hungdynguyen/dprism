import type { Expert, PlanDocument, Task, ValidationIssue } from '@/types';
import { Field } from '@/components/Field';
import { Button } from '@/components/Button';
import { Trash2 } from 'lucide-react';
import { PLAN_LIMITS } from '@/utils/plan';
export function TaskEditor({
  task,
  tasks,
  experts,
  documents,
  issues,
  onChange,
  onRemove,
  onContext,
}: Readonly<{
  task: Task;
  tasks: Task[];
  experts: Expert[];
  documents: PlanDocument[];
  issues: ValidationIssue[];
  onChange: (change: Partial<Task>) => void;
  onRemove: () => void;
  onContext: () => void;
}>) {
  const error = (id: string) => issues.find((e) => e.taskId === task.id && e.field === id)?.message;
  const toggle = (values: string[], id: string, checked: boolean) =>
    checked ? [...values, id] : values.filter((v) => v !== id);
  return (
    <section className="task-panel">
      <div className="panel-heading">
        <div>
          <h2 className="section-title">{task.id} · Chi tiết task</h2>
          <p className="mt-1 text-xs text-n4">Chỉ áp dụng cho plan của case này</p>
        </div>
        <Button className="!min-h-8 !px-2 !py-1" onClick={onContext}>
          Xem context
        </Button>
      </div>
      <div className="panel-body space-y-5">
        <Field id="task-title" label="Tên task" error={error('task-title')}>
          <input
            id="task-title"
            value={task.title}
            aria-invalid={!!error('task-title')}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-5">
            <Field
              id="task-instruction"
              label="Hướng dẫn thực hiện"
              error={error('task-instruction')}
            >
              <textarea
                id="task-instruction"
                value={task.instruction}
                aria-invalid={!!error('task-instruction')}
                onChange={(e) => onChange({ instruction: e.target.value })}
              />
            </Field>
            <Field id="task-output" label="Đầu ra cần đạt" error={error('task-output')}>
              <textarea
                id="task-output"
                value={task.output}
                aria-invalid={!!error('task-output')}
                onChange={(e) => onChange({ output: e.target.value })}
              />
            </Field>
          </div>
          <div className="space-y-5">
            <fieldset id="task-experts" tabIndex={-1}>
              <legend className="mb-2 text-sm font-semibold">Expert được giao</legend>
              {experts.map((expert) => (
                <label
                  key={expert.id}
                  className="flex cursor-pointer items-center gap-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={task.expertIds.includes(expert.id)}
                    onChange={(e) => {
                      const ids = toggle(task.expertIds, expert.id, e.target.checked);
                      onChange({
                        expertIds: ids,
                        maxRounds:
                          ids.length > 1 && task.reviewMode === 'cross'
                            ? Math.max(1, task.maxRounds)
                            : task.maxRounds,
                      });
                    }}
                  />
                  {expert.role}
                </label>
              ))}
              {error('task-experts') && (
                <p className="text-xs text-primary">{error('task-experts')}</p>
              )}
            </fieldset>
            <fieldset id="task-dependencies" tabIndex={-1}>
              <legend className="mb-2 text-sm font-semibold">Phụ thuộc</legend>
              {tasks
                .filter((t) => t.id !== task.id)
                .map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={task.dependsOn.includes(t.id)}
                      onChange={(e) =>
                        onChange({ dependsOn: toggle(task.dependsOn, t.id, e.target.checked) })
                      }
                    />
                    {t.id} · {t.title}
                  </label>
                ))}
              {task.dependsOn
                .filter((id) => !tasks.some((t) => t.id === id))
                .map((id) => (
                  <p key={id} className="my-2 text-xs text-primary">
                    Thiếu task {id}{' '}
                    <button
                      className="underline"
                      onClick={() =>
                        onChange({ dependsOn: task.dependsOn.filter((v) => v !== id) })
                      }
                    >
                      Bỏ liên kết
                    </button>
                  </p>
                ))}
              {error('task-dependencies') && (
                <p className="text-xs text-primary">{error('task-dependencies')}</p>
              )}
            </fieldset>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="task-review" label="Cách phản biện">
            <select
              id="task-review"
              value={task.reviewMode}
              onChange={(e) =>
                onChange({
                  reviewMode: e.target.value as Task['reviewMode'],
                  maxRounds:
                    e.target.value === 'cross' && task.expertIds.length > 1
                      ? Math.max(1, task.maxRounds)
                      : task.maxRounds,
                })
              }
            >
              <option value="cross">Phản biện chéo ẩn danh</option>
              <option value="single">Đánh giá rồi tổng hợp</option>
            </select>
          </Field>
          <Field id="task-rounds" label="Số vòng tối đa" error={error('task-rounds')}>
            <input
              id="task-rounds"
              type="number"
              min={0}
              max={PLAN_LIMITS.maxRounds}
              value={task.maxRounds}
              onChange={(e) => onChange({ maxRounds: Number(e.target.value) })}
            />
          </Field>
          <Field id="task-budget" label="Token budget" error={error('task-budget')}>
            <input
              id="task-budget"
              type="number"
              min={PLAN_LIMITS.minTaskTokens}
              max={PLAN_LIMITS.maxTotalTokens}
              value={task.tokenBudget}
              onChange={(e) => onChange({ tokenBudget: Number(e.target.value) })}
            />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Tài liệu tham khảo của task</legend>
          {documents.map((doc) => (
            <label key={doc.id} className="flex cursor-pointer items-center gap-2 py-2 text-xs">
              <input
                type="checkbox"
                checked={task.documentIds.includes(doc.id)}
                onChange={(e) =>
                  onChange({ documentIds: toggle(task.documentIds, doc.id, e.target.checked) })
                }
              />
              {doc.name}
            </label>
          ))}
        </fieldset>
        <Button variant="danger" disabled={tasks.length <= 1} onClick={onRemove}>
          <Trash2 size={15} />
          Xóa task
        </Button>
      </div>
    </section>
  );
}
