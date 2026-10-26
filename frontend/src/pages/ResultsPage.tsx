import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useRun, useShareRun } from '@/hooks/useRuns';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ErrorState, Loading } from '@/components/AsyncState';
import { ResultsBoard } from '@/components/results/ResultsBoard';
import { RunReport } from '@/components/results/RunReport';
import { useConfirm } from '@/components/ConfirmDialog';
import { isRunActive, RUN_STATUS } from '@/utils/runStatus';
import { downloadFile } from '@/utils/format';
import { reportMarkdown } from '@/utils/results';
export function ResultsPage() {
  const { id = '' } = useParams(),
    query = useRun(id),
    sharing = useShareRun(),
    confirm = useConfirm(),
    [report, setReport] = useState(false);
  if (query.isPending) return <Loading />;
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const run = query.data;
  if (isRunActive(run.status)) return <Navigate to={`/runs/${id}`} replace />;
  const share = async () => {
    if (
      !run.shared &&
      !(await confirm({
        title: 'Chia sẻ toàn bộ case?',
        message:
          'Người xem có thể đọc toàn bộ hồ sơ, tài liệu, plan, nhận định expert, bằng chứng và trace đang hiển thị. Bạn có thể thu hồi chia sẻ sau.',
        confirmLabel: 'Chia sẻ toàn bộ',
      }))
    )
      return;
    try {
      await sharing.mutateAsync({ id, shared: !run.shared });
    } catch {
      /* Mutation error is shown below. */
    }
  };
  return (
    <div className="workspace">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs text-n4">
            KẾT QUẢ THẢO LUẬN{run.mock ? ' · DỮ LIỆU MÔ PHỎNG' : ''}
          </p>
          <h1 className="max-w-2xl truncate text-xl font-semibold" title={run.title}>
            {run.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={RUN_STATUS[run.status].tone}>{RUN_STATUS[run.status].label}</Badge>
          <Button onClick={() => setReport(!report)}>
            {report ? 'Argument map' : 'Xem báo cáo'}
          </Button>
          <Button
            onClick={() => downloadFile(`${run.id}.json`, JSON.stringify(run, null, 2))}
            aria-label="Xuất JSON"
          >
            <Download size={15} />
            JSON
          </Button>
          <Button
            onClick={() => downloadFile(`${run.id}.md`, reportMarkdown(run), 'text/markdown')}
            className="hidden sm:inline-flex"
          >
            Markdown
          </Button>
          <Button onClick={() => void share()} disabled={sharing.isPending}>
            <Share2 size={15} />
            {run.shared ? 'Thu hồi chia sẻ' : 'Chia sẻ'}
          </Button>
        </div>
      </header>
      {sharing.error && <ErrorState error={sharing.error} />}
      {run.exitReason && !report && (
        <div
          role="alert"
          className="rounded border border-warning bg-warning-soft px-4 py-2 text-xs text-warning"
        >
          {run.exitReason}
        </div>
      )}
      {report ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <RunReport run={run} />
        </div>
      ) : (
        <ResultsBoard run={run} />
      )}
      <footer className="flex shrink-0 items-center justify-between gap-3">
        <Link to="/cases" className="flex items-center gap-2 text-sm text-n4">
          <ArrowLeft size={15} />
          Quay lại Cases
        </Link>
        <p className="hidden text-xs text-n4 sm:block">
          Kết quả giữ nguyên các quan điểm khác nhau; chưa được người thật phê duyệt.
        </p>
      </footer>
    </div>
  );
}
