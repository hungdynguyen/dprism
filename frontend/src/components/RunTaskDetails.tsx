import type { Run, Task } from '@/types';
import { LoaderCircle } from 'lucide-react';
import { isActiveTask, TASK_STATUS } from '@/utils/runStatus';
import { Badge } from '@/components/Badge';
export function RunTaskDetails({ run, task }: Readonly<{ run: Run; task: Task | undefined }>) {
  if (!task) return null;
  const status = run.taskStates[task.id],
    result = run.results.find((r) => r.taskId === task.id);
  return (
    <section className="task-panel">
      <header className="panel-heading">
        <h2 className="section-title min-w-0 truncate" title={`${task.id} · ${task.title}`}>
          {task.id} · {task.title}
        </h2>
        {status && (
          <span className="shrink-0">
            <Badge tone={TASK_STATUS[status].tone}>{TASK_STATUS[status].label}</Badge>
          </span>
        )}
      </header>
      <div className="panel-body space-y-5 [overflow-anchor:none]">
        <div className="grid gap-5 md:grid-cols-2">
          <section>
            <h3 className="section-title">Expert được giao</h3>
            <p className="mt-2 text-sm text-n4">
              {task.expertIds
                .map((id) => run.experts.find((e) => e.id === id)?.role || id)
                .join(' · ')}
            </p>
            <h3 className="section-title mt-4">Context đầu vào</h3>
            <p className="mt-2 text-sm text-n4">{task.instruction}</p>
            <p className="helper mt-2">
              {task.dependsOn.length
                ? `Brief từ ${task.dependsOn.join(', ')}`
                : 'Task gốc, chưa có upstream'}{' '}
              · {task.maxRounds} vòng tối đa · {task.tokenBudget.toLocaleString('vi-VN')} token
            </p>
          </section>
          <section>
            <h3 className="section-title">Đầu ra</h3>
            {status && isActiveTask(status) && (
              <p className="mt-2 flex min-h-7 items-center gap-2 text-xs text-primary">
                <LoaderCircle
                  size={14}
                  aria-hidden="true"
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                />
                Đang xử lý · {TASK_STATUS[status].label}
              </p>
            )}
            <p className="mt-2 text-sm text-n4">{result?.summary || task.output}</p>
            {result?.disagreements.map((d, i) => (
              <div
                key={i}
                className="mt-3 rounded bg-warning-soft p-3 text-xs leading-6 text-warning"
              >
                {d.aspect}: {d.resolutionNote}
              </div>
            ))}
          </section>
        </div>
        {result && (
          <details className="border-t border-n2 pt-4">
            <summary className="cursor-pointer text-sm font-semibold">Upstream brief</summary>
            <pre className="mt-3 whitespace-pre-wrap rounded bg-n1 p-3 text-xs leading-6">
              {result.upstreamBrief}
            </pre>
          </details>
        )}
      </div>
    </section>
  );
}
