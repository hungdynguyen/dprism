import { useState } from 'react';
import { FileText, Save, Undo2 } from 'lucide-react';
import type { CaseDraft, Expert, Task, ValidationIssue } from '@/types';
import { useSampleCase, useSharedCases } from '@/hooks/useCases';
import { PlanGraph } from '@/components/plan/PlanGraph';
import { TaskEditor } from '@/components/plan/TaskEditor';
import { ContextPreview } from '@/components/plan/ContextPreview';
import { Documents } from '@/components/plan/Documents';
import { Field } from '@/components/Field';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { ErrorState } from '@/components/AsyncState';
import { useConfirm } from '@/components/ConfirmDialog';
import { nextTask } from '@/utils/plan';
export function PlanningWorkspace({
  draft,
  experts,
  update,
  issues,
  saving,
  saveError,
  onSave,
  readonly = false,
}: Readonly<{
  draft: CaseDraft;
  experts: Expert[];
  update: (change: Partial<CaseDraft> | ((old: CaseDraft) => Partial<CaseDraft>)) => void;
  issues: ValidationIssue[];
  saving: boolean;
  saveError: unknown;
  onSave: () => void;
  readonly?: boolean;
}>) {
  const [selected, setSelected] = useState(draft.tasks[0]?.id || ''),
    [tab, setTab] = useState('graph'),
    [context, setContext] = useState(false),
    [deleted, setDeleted] = useState<{ task: Task; index: number } | null>(null);
  const task = draft.tasks.find((t) => t.id === selected) || draft.tasks[0],
    confirm = useConfirm(),
    sample = useSampleCase(),
    shared = useSharedCases();
  const changeTask = (change: Partial<Task>) =>
    update((old) => ({
      tasks: old.tasks.map((t) => (t.id === task?.id ? { ...t, ...change } : t)),
    }));
  const remove = async () => {
    if (!task) return;
    const affected = draft.tasks.filter((t) => t.dependsOn.includes(task.id));
    if (
      !(await confirm({
        title: `Xóa task ${task.id}?`,
        message: affected.length
          ? `${affected.map((t) => t.id).join(', ')} đang phụ thuộc task này. Các liên kết thiếu sẽ cần được sửa trước khi chạy.`
          : 'Bạn có thể hoàn tác trước khi rời màn hình.',
        danger: true,
        confirmLabel: 'Xóa task',
      }))
    )
      return;
    setDeleted({ task, index: draft.tasks.indexOf(task) });
    update({ tasks: draft.tasks.filter((t) => t.id !== task.id) });
  };
  const loadSample = async () => {
    try {
      const data = await sample.mutateAsync();
      update((old) => ({
        context: data.context,
        documents: [...old.documents.filter((d) => d.id !== data.document.id), data.document],
      }));
    } catch {
      /* Error shown in inspector. */
    }
  };
  const error = (field: string) => issues.find((e) => !e.taskId && e.field === field)?.message;
  const selectTask = (id: string) => {
    setSelected(id);
    setTab('details');
  };
  return (
    <>
      <div className="lg:hidden">
        <Tabs
          label="Panel của plan"
          items={[
            { value: 'graph', label: 'DAG' },
            { value: 'details', label: 'Chi tiết' },
            { value: 'info', label: 'Thông tin' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {issues.length > 0 && (
        <div
          role="alert"
          className="flex shrink-0 flex-wrap gap-2 rounded-md border border-tint-2 bg-tint-3 p-3 text-xs text-primary"
        >
          {issues.map((issue, index) => (
            <button
              key={`${issue.field}-${index}`}
              className="text-left underline"
              onClick={() => {
                if (issue.taskId) {
                  setSelected(issue.taskId);
                  setTab('details');
                } else setTab('info');
                requestAnimationFrame(() => document.getElementById(issue.field)?.focus());
              }}
            >
              {issue.message}
            </button>
          ))}
        </div>
      )}
      <div className="workspace-grid">
        <div className={`${tab === 'info' ? 'hidden lg:grid' : 'grid'} workspace-left`}>
          <div className={`${tab !== 'graph' ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col`}>
            <PlanGraph
              tasks={draft.tasks}
              selectedId={task?.id || ''}
              onSelect={selectTask}
              onAdd={
                readonly
                  ? undefined
                  : () => {
                      const item = nextTask(draft.tasks, deleted ? [deleted.task.id] : []);
                      update({ tasks: [...draft.tasks, item] });
                      setSelected(item.id);
                      setTab('details');
                    }
              }
            />
          </div>
          <div className={`${tab !== 'details' ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col`}>
            {task ? (
              readonly ? (
                <section className="task-panel">
                  <div className="panel-heading">
                    <h2 className="section-title">
                      {task.id} · {task.title}
                    </h2>
                    <Button onClick={() => setContext(true)}>Xem context</Button>
                  </div>
                  <div className="panel-body">
                    <p className="text-n4">{task.instruction}</p>
                    <h3 className="section-title mt-5">Đầu ra</h3>
                    <p className="mt-2 text-n4">{task.output}</p>
                    <p className="helper mt-4">
                      {task.expertIds
                        .map((id) => experts.find((e) => e.id === id)?.role || id)
                        .join(' · ')}
                    </p>
                    <p className="helper">
                      {task.maxRounds} vòng tối đa · {task.tokenBudget.toLocaleString('vi-VN')}{' '}
                      token
                    </p>
                  </div>
                </section>
              ) : (
                <TaskEditor
                  key={task.id}
                  task={task}
                  tasks={draft.tasks}
                  experts={experts}
                  documents={draft.documents}
                  issues={issues}
                  onChange={changeTask}
                  onRemove={() => void remove()}
                  onContext={() => setContext(true)}
                />
              )
            ) : (
              <p className="p-5 text-n4">Thêm task để chỉnh cấu hình.</p>
            )}
          </div>
        </div>
        <aside className={`${tab !== 'info' ? 'hidden lg:flex' : 'flex'} task-panel`}>
          <header className="panel-heading">
            <h2 className="section-title">Thông tin case</h2>
            <span className="text-[11px] text-n4">{saving ? 'Đang lưu…' : 'Bản nháp'}</span>
          </header>
          <div className="panel-body space-y-5">
            <Field id="case-title" label="Tên case" required error={error('case-title')}>
              <input
                id="case-title"
                readOnly={readonly}
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                aria-invalid={!!error('case-title')}
              />
            </Field>
            <Field
              id="case-objective"
              label="Mục tiêu cần giải quyết"
              required
              error={error('case-objective')}
            >
              <textarea
                id="case-objective"
                readOnly={readonly}
                value={draft.context.task}
                onChange={(e) => update({ context: { ...draft.context, task: e.target.value } })}
                aria-invalid={!!error('case-objective')}
              />
            </Field>
            {!readonly && (
              <button
                onClick={() => void loadSample()}
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary"
              >
                <FileText size={14} />
                Dùng hồ sơ AutoSupport mẫu
              </button>
            )}
            <Field id="case-output" label="Đầu ra mong muốn" required error={error('case-output')}>
              <textarea
                id="case-output"
                readOnly={readonly}
                value={draft.output}
                onChange={(e) => update({ output: e.target.value })}
                aria-invalid={!!error('case-output')}
              />
            </Field>
            <div>
              <h3 className="section-title mb-3">Tài liệu đầu vào</h3>
              <Documents
                documents={draft.documents}
                onAdd={
                  readonly
                    ? undefined
                    : (doc) => update((old) => ({ documents: [...old.documents, doc] }))
                }
                onRemove={
                  readonly
                    ? undefined
                    : (id) =>
                        update((old) => ({
                          documents: old.documents.filter((d) => d.id !== id),
                          tasks: old.tasks.map((t) => ({
                            ...t,
                            documentIds: t.documentIds.filter((v) => v !== id),
                          })),
                        }))
                }
              />
            </div>
            <details className="border-t border-n2 pt-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Case tham khảo · {draft.referenceCaseIds.length}
              </summary>
              <div className="mt-3">
                {shared.data?.map((c) => (
                  <label key={c.id} className="flex items-start gap-2 py-2 text-xs leading-6">
                    <input
                      type="checkbox"
                      disabled={readonly}
                      checked={draft.referenceCaseIds.includes(c.id)}
                      onChange={(e) =>
                        update({
                          referenceCaseIds: e.target.checked
                            ? [...draft.referenceCaseIds, c.id]
                            : draft.referenceCaseIds.filter((id) => id !== c.id),
                        })
                      }
                    />
                    {c.title}
                  </label>
                ))}
              </div>
            </details>
            {deleted && !readonly && (
              <Button
                onClick={() => {
                  update((old) => {
                    const tasks = [...old.tasks];
                    tasks.splice(Math.min(deleted.index, tasks.length), 0, deleted.task);
                    return { tasks };
                  });
                  setDeleted(null);
                }}
              >
                <Undo2 size={15} />
                Hoàn tác xóa {deleted.task.id}
              </Button>
            )}
            {!readonly && (
              <Button onClick={onSave} disabled={saving}>
                <Save size={15} />
                Lưu bản nháp
              </Button>
            )}
            {(saveError || sample.error) && <ErrorState error={saveError || sample.error} />}
          </div>
        </aside>
      </div>
      {context && task && (
        <ContextPreview
          draft={draft}
          task={task}
          experts={experts}
          onClose={() => setContext(false)}
        />
      )}
    </>
  );
}
