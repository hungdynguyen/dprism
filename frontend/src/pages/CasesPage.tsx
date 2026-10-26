import { useState } from 'react';
import { ArrowRight, FileText, MessageSquare, Network, Search } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCase, useCases, useSharedCases, useUpdateCase } from '@/hooks/useCases';
import { useChatStore } from '@/hooks/useChatStore';
import { PageHeader } from '@/components/PageHeader';
import { Tabs } from '@/components/Tabs';
import { Badge } from '@/components/Badge';
import { CreateCaseDialog } from '@/components/CreateCaseDialog';
import { ErrorState, Loading } from '@/components/AsyncState';
import { formatDate, matchesSearch } from '@/utils/format';
import type { CaseDraft } from '@/types';
import { caseDestination } from '@/utils/caseNavigation';
import { isRunActive, RUN_STATUS } from '@/utils/runStatus';
export function CasesPage() {
  const cases = useCases(),
    shared = useSharedCases(),
    chats = useChatStore((s) => s.conversations),
    [params, setParams] = useSearchParams(),
    tab = params.get('tab') || 'mine';
  const resumeId = params.get('resume') || '';
  const resumed = useCase(resumeId),
    save = useUpdateCase(resumeId),
    navigate = useNavigate();
  const references = params.getAll('reference');
  const [search, setSearch] = useState(''),
    [creating, setCreating] = useState<'template' | 'open' | null>(null);
  const hasChat = (item: CaseDraft) => chats.some((c) => c.id === item.chatId);
  const pending = tab === 'mine' ? cases.isPending : tab === 'shared' ? shared.isPending : false;
  const error = tab === 'mine' ? cases.error : tab === 'shared' ? shared.error : null;
  const rows =
    tab === 'shared'
      ? (shared.data || [])
          .filter((c) => matchesSearch(c.title, search))
          .map((c) => ({
            id: c.id,
            title: c.title,
            subtitle: c.owner,
            kind: 'Case chia sẻ',
            state: 'Public',
            to: `/shared/${c.id}`,
            date: c.publishedAt,
            action: 'Xem chi tiết',
          }))
      : tab === 'chats'
        ? chats
            .filter((c) => matchesSearch(`${c.title} ${c.expert.role}`, search))
            .map((c) => ({
              id: c.id,
              title: c.title,
              subtitle: c.expert.role,
              kind: 'Trao đổi riêng',
              state: `${c.messages.filter((m) => m.role === 'user').length} tin nhắn`,
              to: `/chats/${c.id}`,
              date: c.updatedAt,
              action: 'Tiếp tục trao đổi',
            }))
        : (cases.data || [])
            .filter((c) => (!c.chatId || !hasChat(c)) && matchesSearch(c.title, search))
            .map((c) => ({
              id: c.id,
              title: c.title,
              subtitle: c.context.task || 'Tiếp tục chuẩn bị case.',
              kind:
                c.method === 'template'
                  ? 'Theo template'
                  : c.method === 'open'
                    ? 'Theo chủ đề'
                    : c.method === 'direct'
                      ? 'Trao đổi riêng'
                      : 'Chưa chọn hình thức',
              state: c.runStatus
                ? RUN_STATUS[c.runStatus].label
                : c.runId
                  ? 'Đã bắt đầu'
                  : 'Bản nháp',
              to: c.chatId && !hasChat(c) ? `/cases/${c.id}/experts` : caseDestination(c),
              date: c.updatedAt,
              action: c.runId
                ? isRunActive(c.runStatus)
                  ? 'Xem tiến trình'
                  : 'Xem kết quả'
                : c.method === 'template' && !c.templateId
                  ? 'Chọn template'
                  : 'Tiếp tục',
            }));
  rows.sort((a, b) => b.date.localeCompare(a.date));
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
        title="Cùng expert giải quyết vấn đề"
        description="Chọn cách bắt đầu hoặc tiếp tục công việc gần đây của bạn."
      />
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
      <section aria-label="Bắt đầu công việc" className="mb-10 grid gap-3 md:grid-cols-3 md:gap-4">
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
      <h2 className="mb-5 text-lg font-semibold">Case gần đây</h2>
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
            count: cases.data?.filter((c) => !c.chatId || !hasChat(c)).length,
          },
          { value: 'shared', label: 'Đã chia sẻ', count: shared.data?.length },
          { value: 'chats', label: 'Trao đổi riêng', count: chats.length },
        ]}
      />
      <div className="relative my-6 max-w-md">
        <Search size={17} className="absolute left-3 top-3 text-n4" />
        <input
          aria-label="Tìm trong lịch sử"
          className="!pl-10"
          placeholder="Tìm trong lịch sử…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && (
        <ErrorState
          error={error}
          retry={() => {
            void cases.refetch();
            void shared.refetch();
          }}
        />
      )}
      {pending ? (
        <Loading />
      ) : (
        <section
          role="tabpanel"
          aria-label={tab}
          className="overflow-hidden rounded-lg border border-n2 bg-n0"
        >
          {rows.map((row) => (
            <article
              key={row.id}
              className="flex flex-wrap items-center gap-4 border-b border-n2 p-5 last:border-0"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-n1 text-n4">
                {tab === 'chats' ? <MessageSquare size={18} /> : <FileText size={18} />}
              </span>
              <div className="min-w-52 flex-1">
                <Link to={row.to} className="font-semibold hover:text-primary">
                  {row.title}
                </Link>
                <p className="mt-1 line-clamp-1 text-xs text-n4">{row.subtitle}</p>
              </div>
              <span className="hidden text-xs text-n4 md:block">{row.kind}</span>
              <Badge>{row.state}</Badge>
              <span className="hidden text-xs text-n4 xl:block">{formatDate(row.date)}</span>
              <Link
                className="rounded-md border border-n2 px-3 py-2 text-xs font-semibold"
                to={row.to}
              >
                {row.action}
              </Link>
            </article>
          ))}
          {!rows.length && (
            <div className="p-12 text-center">
              <h2 className="font-semibold">
                {search ? 'Không tìm thấy kết quả' : 'Chưa có nội dung'}
              </h2>
              <p className="my-3 text-n4">
                {search
                  ? 'Thử một từ khóa khác.'
                  : 'Chọn một cách bắt đầu ở phía trên để tạo case mới.'}
              </p>
            </div>
          )}
        </section>
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
