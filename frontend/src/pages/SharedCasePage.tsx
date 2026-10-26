import { Link, useParams } from 'react-router-dom';
import { CopyPlus, Download } from 'lucide-react';
import { useSharedCase } from '@/hooks/useCases';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { ErrorState, Loading } from '@/components/AsyncState';
import { RunReport } from '@/components/results/RunReport';
import { downloadFile } from '@/utils/format';
export function SharedCasePage() {
  const { id = '' } = useParams(),
    query = useSharedCase(id);
  if (query.isPending) return <Loading />;
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const item = query.data;
  return (
    <>
      <BackLink to="/cases?tab=shared">Quay lại case chia sẻ</BackLink>
      <PageHeader
        eyebrow={`CHIA SẺ TOÀN BỘ · ${item.owner}`}
        title={item.title}
        description={item.summary}
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => downloadFile(`${item.id}.json`, JSON.stringify(item.run, null, 2))}
            >
              <Download size={15} />
              JSON
            </Button>
            <Link
              to={`/cases?reference=${encodeURIComponent(id)}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-n0 hover:bg-primary-deep"
            >
              <CopyPlus size={16} />
              Dùng làm context
            </Link>
          </div>
        }
      />
      <RunReport run={item.run} />
    </>
  );
}
