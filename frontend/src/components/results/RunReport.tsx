import type { Run } from '@/types';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ResultInspector } from '@/components/results/ResultInspector';
import { Documents } from '@/components/plan/Documents';
import { RUN_STATUS } from '@/utils/runStatus';
import { formatTime } from '@/utils/format';
export function RunReport({ run }: Readonly<{ run: Run }>) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="helper">Trạng thái thực hiện</p>
          <div className="mt-3">
            <Badge tone={RUN_STATUS[run.status].tone}>{RUN_STATUS[run.status].label}</Badge>
          </div>
        </Card>
        <Card>
          <p className="helper">Task có kết quả</p>
          <p className="mt-2 text-2xl font-semibold">
            {run.results.length} / {run.plan.tasks.length}
          </p>
        </Card>
        <Card>
          <p className="helper">Bất đồng được bảo tồn</p>
          <p className="mt-2 text-2xl font-semibold">
            {run.results.reduce((sum, r) => sum + r.disagreements.length, 0)}
          </p>
        </Card>
      </div>
      {run.exitReason && (
        <div
          role="alert"
          className="rounded-md border border-warning bg-warning-soft p-4 text-warning"
        >
          {run.exitReason}
        </div>
      )}
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Mục tiêu & đầu ra</h2>
        <p className="text-n4">{run.plan.context.task}</p>
        <p className="mt-3 text-n4">{run.plan.output}</p>
        <p className="helper mt-4">
          Hoàn tất quy trình không đồng nghĩa được người thẩm định phê duyệt.
          {run.mock && ' Các nhận định và bằng chứng liên kết đang là dữ liệu mô phỏng.'}
        </p>
      </Card>
      <section className="grid gap-5 lg:grid-cols-2">
        {run.results.map((result) => (
          <Card key={result.taskId} className="!p-0">
            <ResultInspector result={result} run={run} />
          </Card>
        ))}
      </section>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Tài liệu hồ sơ & quy trình</h2>
        <Documents documents={run.plan.documents} />
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Trace thực hiện</h2>
        <ol className="space-y-4">
          {run.trace.map((event) => (
            <li key={event.id} className="flex gap-4 border-l-2 border-n2 pl-4">
              <time className="shrink-0 text-xs text-n4">{formatTime(event.time)}</time>
              <div>
                <strong className="text-sm font-semibold">
                  {event.taskId && `${event.taskId} · `}
                  {event.title}
                </strong>
                <p className="mt-1 text-xs text-n4">{event.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <details className="rounded-lg border border-n2 bg-n0 p-5">
        <summary className="cursor-pointer font-semibold">
          Plan đã cố định & dữ liệu trao đổi
        </summary>
        <pre className="mt-5 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-n1 p-4 text-xs leading-6">
          {JSON.stringify(run, null, 2)}
        </pre>
      </details>
    </div>
  );
}
