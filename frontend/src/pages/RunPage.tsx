import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useRun } from '@/hooks/useRuns';
import { isRunActive, TASK_STATUS } from '@/utils/runStatus';
import { PlanGraph } from '@/components/plan/PlanGraph';
import { RunTaskDetails } from '@/components/RunTaskDetails';
import { ErrorState } from '@/components/AsyncState';
import { PipelineLoading } from '@/components/PipelineLoading';
import { Tabs } from '@/components/Tabs';
import { Badge } from '@/components/Badge';
import { formatTime } from '@/utils/format';
import { apiErrorMessage } from '@/utils/apiError';
export function RunPage() {
  const { id = '' } = useParams(),
    query = useRun(id),
    [selected, setSelected] = useState(''),
    [follow, setFollow] = useState(true),
    [tab, setTab] = useState('graph'),
    navigate = useNavigate();
  const status = query.data?.status;
  useEffect(() => {
    if (!status) return;
    // Warm the results chunk while keeping the running graph mounted.
    void import('@/pages/ResultsPage').catch(() => {
      /* Normal route loading can retry later. */
    });
    if (isRunActive(status)) return;
    // A short completion cue makes the automatic dashboard transition predictable.
    const timer = setTimeout(() => navigate(`/runs/${id}/results`, { replace: true }), 700);
    return () => clearTimeout(timer);
  }, [status, id, navigate]);
  if (query.isPending) return <PipelineLoading />;
  if (!query.data) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const run = query.data;
  const finishing = !isRunActive(run.status);
  const task =
      run.plan.tasks.find(
        (t) => t.id === (follow ? run.activeTaskId || run.results.at(-1)?.taskId : selected),
      ) || run.plan.tasks[0],
    progress = run.plan.tasks.length
      ? Math.round((run.results.length / run.plan.tasks.length) * 100)
      : 0;
  return (
    <div className="workspace">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs text-n4">
            {finishing ? 'ĐANG MỞ KẾT QUẢ' : 'ĐANG THỰC HIỆN'}
            {run.mock && ' · MÔ PHỎNG'}
          </p>
          <h1 className="truncate text-xl font-semibold" title={run.title}>
            {run.title}
          </h1>
        </div>
        <span
          role="status"
          className="flex min-w-28 shrink-0 items-center justify-end gap-2 text-xs text-primary"
        >
          <LoaderCircle
            size={16}
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
          {finishing ? 'Đang mở kết quả…' : 'Đang chạy'}
        </span>
      </header>
      <div className="flex h-5 shrink-0 items-center gap-2 text-xs text-n4">
        {query.isRefetchError ? (
          <>
            <span
              role="alert"
              title={apiErrorMessage(query.error)}
              className="min-w-0 flex-1 truncate text-primary"
            >
              Chưa cập nhật được tiến trình. Đang giữ dữ liệu gần nhất.
            </span>
            <button
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
              className="shrink-0 font-semibold text-primary disabled:opacity-45"
            >
              Thử lại
            </button>
          </>
        ) : (
          <p className="truncate text-xs">
            {finishing
              ? 'Đã nhận kết quả pipeline.'
              : 'Tiến trình được cập nhật tự động. Bạn có thể xem từng task trong DAG.'}
          </p>
        )}
      </div>
      <div className="lg:hidden">
        <Tabs
          label="Panel tiến trình"
          items={[
            { value: 'graph', label: 'DAG' },
            { value: 'details', label: 'Chi tiết' },
            { value: 'info', label: 'Tiến trình' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div className="workspace-grid relative" role="region" aria-label="Pipeline">
        <div
          className={`${tab === 'info' ? 'hidden lg:grid' : 'grid'} workspace-left lg:!grid-rows-[minmax(220px,2fr)_minmax(160px,1fr)]`}
        >
          <div className={`${tab !== 'graph' ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col`}>
            <PlanGraph
              tasks={run.plan.tasks}
              selectedId={task?.id || ''}
              onSelect={(value) => {
                setSelected(value);
                setFollow(false);
                setTab('details');
              }}
              statuses={run.taskStates}
            />
          </div>
          <div className={`${tab !== 'details' ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col`}>
            <RunTaskDetails run={run} task={task} />
          </div>
        </div>
        <aside className={`${tab !== 'info' ? 'hidden lg:flex' : 'flex'} task-panel`}>
          <header className="panel-heading">
            <h2 className="section-title">Tiến trình thực hiện</h2>
          </header>
          <div className="panel-body space-y-6 [overflow-anchor:none]">
            <div>
              <div className="mb-3 flex justify-between text-sm">
                <strong>
                  {run.results.length} / {run.plan.tasks.length} task
                </strong>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Tiến trình plan"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-n1"
              >
                <div
                  className="h-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {run.mock && <p className="helper mt-3">3 giây / task · Không gọi model</p>}
            </div>
            <section>
              <h3 className="section-title">Đang xử lý</h3>
              <p className="my-3 min-h-14 text-n4 line-clamp-2">
                {finishing
                  ? 'Đã kết thúc pipeline.'
                  : run.plan.tasks.find((t) => t.id === run.activeTaskId)?.title ||
                    'Đang chuẩn bị task tiếp theo…'}
              </p>
              {run.activeTaskId && (
                <Badge tone="primary">{TASK_STATUS[run.taskStates[run.activeTaskId]].label}</Badge>
              )}
            </section>
            <section>
              <h3 className="section-title">Expert tham gia</h3>
              {run.experts.map((e) => (
                <p key={e.id} className="mt-2 text-sm text-n4">
                  {e.role}
                </p>
              ))}
            </section>
            <section>
              <h3 className="section-title">Sự kiện gần nhất</h3>
              <div className="mt-3 min-h-52">
                {run.trace
                  .slice(-4)
                  .reverse()
                  .map((t) => (
                    <div key={t.id} className="h-[52px] text-xs text-n4">
                      <time className="tabular-nums">{formatTime(t.time)}</time>
                      <p className="truncate leading-6" title={t.title}>
                        {t.title}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
            <p className="helper">
              Plan đã cố định. Bạn có thể rời trang và quay lại theo dõi tiến trình.
            </p>
          </div>
        </aside>
        {finishing && (
          <div
            className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-n0/90 p-6"
            role="status"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2
                size={28}
                aria-hidden="true"
                className={run.status === 'COMPLETED' ? 'text-success' : 'text-warning'}
              />
              <h2 className="text-lg font-semibold">
                {run.status === 'COMPLETED'
                  ? 'Pipeline đã hoàn tất'
                  : 'Pipeline đã kết thúc với kết quả một phần'}
              </h2>
              <p className="flex items-center gap-2 text-sm text-n4">
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
                Đang mở dashboard kết quả…
              </p>
            </div>
          </div>
        )}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-4">
        <Link to="/cases" className="flex items-center gap-2 text-sm font-medium text-n4">
          <ArrowLeft size={15} />
          Quay lại Cases
        </Link>
        <button
          className="text-xs font-semibold text-primary"
          onClick={() => {
            setFollow(true);
            setTab('graph');
          }}
        >
          Theo dõi task đang chạy
        </button>
      </footer>
    </div>
  );
}
