import { useMemo, useState } from 'react';
import { ArrowRight, FileText, MessageSquare, Network } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCase, useCases, useSharedCases, useUpdateCase } from '@/hooks/useCases';
import { useChatStore } from '@/hooks/useChatStore';
import { PageHeader } from '@/components/PageHeader';
import { Tabs } from '@/components/Tabs';
import { OwnedCaseList } from '@/components/OwnedCaseList';
import { CaseCatalog } from '@/components/catalog/CaseCatalog';
import { ownedCaseRows } from '@/utils/ownedCases';
import { CreateCaseDialog } from '@/components/CreateCaseDialog';
import { ErrorState, Loading } from '@/components/AsyncState';
import type { CaseDraft } from '@/types';
import { caseDestination } from '@/utils/caseNavigation';
export function CasesPage() {
  const cases = useCases(),
    received = useSharedCases('received'),
    library = useSharedCases('public'),
    chats = useChatStore((s) => s.conversations),
    [params, setParams] = useSearchParams(),
    tab =
      params.get('tab') === 'received'
        ? 'received'
        : ['library', 'shared'].includes(params.get('tab') || '')
          ? 'library'
          : 'mine';
  const resumeId = params.get('resume') || '';
  const resumed = useCase(resumeId),
    save = useUpdateCase(resumeId),
    navigate = useNavigate();
  const references = params.getAll('reference');
  const [creating, setCreating] = useState<'template' | 'open' | null>(null);
  const rows = useMemo(() => ownedCaseRows(cases.data || [], chats), [cases.data, chats]);
  const catalog = tab === 'received' ? received : library;
  const choose = async (method: 'template' | 'open' | 'direct') => {
    if (resumeId && resumed.isPending) return;
    if (resumed.data) {
      const current = resumed.data;
      if (current.runId || current.chatId) {
        navigate(caseDestination(current));
        return;
      }
      try {
        const updated: CaseDraft = {
          ...current,
          method,
          wizardStep: 1,
          revision: current.revision + 1,
        };
        await save.mutateAsync(updated);
        navigate(caseDestination(updated));
      } catch {
        /* Preserve the existing case and display the mutation error. */
      }
      return;
    }
    if (resumeId) return;
    if (method === 'direct') {
      const pickerParams = new URLSearchParams({ returnTo: '/cases' });
      references.forEach((reference) => pickerParams.append('reference', reference));
      navigate(`/experts/select?${pickerParams.toString()}`);
    } else setCreating(method);
  };
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Cases"
        description="Bắt đầu công việc, tiếp tục case của bạn hoặc khám phá tri thức được chia sẻ."
      />
      <div className="mb-6">
        <Tabs
          label="Loại lịch sử"
          value={tab}
          onChange={(value) =>
            setParams((current) => {
              const next = new URLSearchParams(current);
              next.set('tab', value);
              return next;
            })
          }
          items={[
            {
              value: 'mine',
              label: 'Case của tôi',
              count: cases.data ? rows.length : undefined,
            },
            { value: 'received', label: 'Case được share với tôi', count: received.data?.length },
            { value: 'library', label: 'Library', count: library.data?.length },
          ]}
        />
      </div>
      {tab === 'mine' ? (
        <>
          {resumeId && (
            <div className="mb-5 rounded-lg border border-n2 bg-n0 p-4">
              {resumed.isPending ? (
                <Loading />
              ) : resumed.error ? (
                <ErrorState error={resumed.error} retry={() => void resumed.refetch()} />
              ) : (
                <p>
                  Tiếp tục chuẩn bị case: <strong>{resumed.data?.title}</strong>
                </p>
              )}
              <Link className="mt-2 inline-block text-xs text-primary underline" to="/cases">
                Bắt đầu một case khác
              </Link>
            </div>
          )}
          {references.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-n2 bg-n0 p-4">
              <p className="text-sm text-n4">
                Case mới sẽ dùng {references.length} case chia sẻ làm context.
              </p>
              <Link to="/cases" className="text-xs text-primary underline">
                Bỏ context
              </Link>
            </div>
          )}
          <section
            aria-label="Bắt đầu công việc"
            className="mb-10 grid gap-3 md:grid-cols-3 md:gap-4"
          >
            {(
              [
                {
                  method: 'template',
                  title: 'Dùng template',
                  description: 'Bắt đầu từ quy trình có sẵn, điều chỉnh plan và chạy.',
                  icon: FileText,
                  action: 'Đặt tên & chọn template',
                },
                {
                  method: 'open',
                  title: 'Thảo luận theo chủ đề',
                  description: 'Mô tả vấn đề để xây dựng plan với nhiều chuyên gia.',
                  icon: Network,
                  action: 'Bắt đầu thảo luận',
                },
                {
                  method: 'direct',
                  title: 'Trao đổi riêng',
                  description: 'Chọn một chuyên gia và trao đổi trực tiếp về vấn đề của bạn.',
                  icon: MessageSquare,
                  action: 'Tìm chuyên gia',
                },
              ] as const
            ).map(({ method, title, description, icon: Icon, action }) => (
              <button
                key={method}
                type="button"
                aria-label={title}
                onClick={() => void choose(method)}
                disabled={save.isPending || (!!resumeId && !resumed.data)}
                className="flex flex-col items-start rounded-xl border border-n2 bg-n0 p-4 text-left transition-colors hover:border-n3 disabled:opacity-45 md:p-6"
              >
                <div className="mb-2 flex items-center gap-3 md:mb-0 md:block">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-tint-1 text-primary md:mb-4 md:h-10 md:w-10">
                    <Icon size={21} />
                  </span>
                  <h2 className="text-base font-semibold tracking-tight md:text-lg">{title}</h2>
                </div>
                <p className="mb-3 text-sm leading-6 text-n4 md:mb-5 md:mt-2">{description}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  {action}
                  <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </section>
          {save.error && <ErrorState error={save.error} />}
          {cases.error ? (
            <ErrorState error={cases.error} retry={() => void cases.refetch()} />
          ) : cases.isPending ? (
            <Loading />
          ) : (
            <OwnedCaseList rows={rows} />
          )}
        </>
      ) : catalog.isPending ? (
        <Loading />
      ) : catalog.error ? (
        <ErrorState error={catalog.error} retry={() => void catalog.refetch()} />
      ) : (
        <CaseCatalog
          key={tab}
          collection={tab === 'received' ? 'received' : 'public'}
          items={catalog.data || []}
        />
      )}
      {creating && (
        <CreateCaseDialog
          key={creating}
          open
          method={creating}
          referenceCaseIds={references}
          onClose={() => setCreating(null)}
        />
      )}
    </>
  );
}
