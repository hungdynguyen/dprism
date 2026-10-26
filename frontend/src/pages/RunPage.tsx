import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleDot } from 'lucide-react';
import { useRun } from '@/hooks/useRuns';
import { isRunActive, TASK_STATUS } from '@/utils/runStatus';
import { PlanGraph } from '@/components/plan/PlanGraph';
import { RunTaskDetails } from '@/components/RunTaskDetails';
import { ErrorState, Loading } from '@/components/AsyncState';
import { Tabs } from '@/components/Tabs';
import { Badge } from '@/components/Badge';
import { formatTime } from '@/utils/format';
export function RunPage() {
  const { id = '' } = useParams(),
    query = useRun(id),
    [selected, setSelected] = useState(''),
    [follow, setFollow] = useState(true),
    [tab, setTab] = useState('graph');
  if (query.isPending) return <Loading />;
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const run = query.data;
  if (!isRunActive(run.status)) return <Navigate to={`/runs/${id}/results`} replace />;
  const task =
      run.plan.tasks.find((t) => t.id === (follow ? run.activeTaskId : selected)) ||
      run.plan.tasks[0],
    progress = Math.round((run.results.length / run.plan.tasks.length) * 100);
  return (
    <div className="workspace">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs text-n4">ĐANG THỰC HIỆN{run.mock && ' · MÔ PHỎNG'}</p>
          <h1 className="truncate text-xl font-semibold" title={run.title}>
            {run.title}
          </h1>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-xs text-primary">
          <CircleDot size={15} className="animate-pulse motion-reduce:animate-none" />
          Đang chạy
        </span>
      </header>
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
      <div className="workspace-grid">
        <div className={`${tab === 'info' ? 'hidden lg:grid' : 'grid'} workspace-left`}>
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
          <div className="panel-body space-y-6">
            <div>
              <div className="mb-3 flex justify-between text-sm">
                <strong>
                  {run.results.length} / {run.plan.tasks.length} task
                </strong>
                <span>{progress}%</span>
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
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {run.mock && <p className="helper mt-3">3 giây / task · Không gọi model</p>}
            </div>
            <section>
              <h3 className="section-title">Đang xử lý</h3>
              <p className="my-3 text-n4">
                {run.plan.tasks.find((t) => t.id === run.activeTaskId)?.title}
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
              {run.trace
                .slice(-4)
                .reverse()
                .map((t) => (
                  <div key={t.id} className="mt-3 text-xs text-n4">
                    <time>{formatTime(t.time)}</time>
                    <p className="leading-6">{t.title}</p>
                  </div>
                ))}
            </section>
            <p className="helper">
              Plan đã cố định. Bạn có thể rời trang và quay lại theo dõi tiến trình.
            </p>
          </div>
        </aside>
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
