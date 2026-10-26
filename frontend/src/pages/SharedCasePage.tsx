import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CopyPlus, Download } from 'lucide-react';
import { useSharedCase } from '@/hooks/useCases';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { ErrorState, Loading } from '@/components/AsyncState';
import { CreateCaseDialog } from '@/components/CreateCaseDialog';
import { RunReport } from '@/components/results/RunReport';
import { downloadFile } from '@/utils/format';
export function SharedCasePage() {
  const { id = '' } = useParams(),
    query = useSharedCase(id),
    [creating, setCreating] = useState(false);
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
            <Button variant="primary" onClick={() => setCreating(true)}>
              <CopyPlus size={16} />
              Dùng làm context
            </Button>
          </div>
        }
      />
      <RunReport run={item.run} />
      <CreateCaseDialog
        open={creating}
        onClose={() => setCreating(false)}
        referenceCaseIds={[id]}
      />
    </>
  );
}
