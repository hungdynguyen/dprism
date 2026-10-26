import { LoaderCircle } from 'lucide-react';

export function PipelineLoading() {
  return (
    <div className="workspace" role="status" aria-busy="true">
      <div className="flex h-11 shrink-0 items-center gap-3 text-sm text-n4">
        <LoaderCircle
          size={19}
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none"
        />
        Đang tải pipeline…
      </div>
      <div className="flex h-5 shrink-0 items-center" aria-hidden="true">
        <div className="h-2 w-64 max-w-full rounded bg-n2" />
      </div>
      <div className="workspace-grid" aria-hidden="true">
        <div className="workspace-left lg:!grid-rows-[minmax(220px,2fr)_minmax(160px,1fr)]">
          <div className="task-panel">
            <div className="panel-heading h-12">
              <div className="h-3 w-24 rounded bg-n2" />
            </div>
            <div className="min-h-0 flex-1 bg-n1/60" />
          </div>
          <div className="task-panel hidden lg:flex">
            <div className="panel-heading h-12">
              <div className="h-3 w-36 rounded bg-n2" />
            </div>
            <div className="panel-body space-y-4">
              <div className="h-3 w-2/3 rounded bg-n1" />
              <div className="h-3 w-1/2 rounded bg-n1" />
            </div>
          </div>
        </div>
        <div className="task-panel hidden lg:flex">
          <div className="panel-heading h-12">
            <div className="h-3 w-32 rounded bg-n2" />
          </div>
          <div className="panel-body space-y-5">
            <div className="h-2 rounded-full bg-n1" />
            <div className="h-12 rounded bg-n1" />
            <div className="h-12 rounded bg-n1" />
          </div>
        </div>
      </div>
      <div className="h-6 shrink-0" aria-hidden="true" />
    </div>
  );
}
