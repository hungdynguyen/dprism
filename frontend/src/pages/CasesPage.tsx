import { useState } from 'react';
import { FileText, MessageSquare, Plus, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCases, useSharedCases } from '@/hooks/useCases';
import { useChatStore } from '@/hooks/useChatStore';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Badge } from '@/components/Badge';
import { CreateCaseDialog } from '@/components/CreateCaseDialog';
import { ErrorState, Loading } from '@/components/AsyncState';
import { formatDate, matchesSearch } from '@/utils/format';
import type { CaseDraft } from '@/types';
import { isRunActive, RUN_STATUS } from '@/utils/runStatus';
export function caseDestination(item: CaseDraft) {
  if (item.runId) return `/runs/${item.runId}`;
  if (item.chatId) return `/chats/${item.chatId}`;
  if (!item.method) return `/cases/${item.id}/start`;
  if (item.method === 'template') return `/cases/${item.id}/plan`;
  if (item.method === 'direct') return `/cases/${item.id}/experts`;
  return `/cases/${item.id}/setup/${item.wizardStep}`;
}
export function CasesPage() {
  const cases = useCases(),
    shared = useSharedCases(),
    chats = useChatStore((s) => s.conversations),
    [params, setParams] = useSearchParams(),
    tab = params.get('tab') || 'mine';
  const [search, setSearch] = useState(''),
    [creating, setCreating] = useState(false);
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
                : 'Tiếp tục',
            }));
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Cases"
        description="Các đánh giá, bản nháp và trao đổi của bạn."
        action={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus size={17} />
            Tạo case
          </Button>
        }
      />
      <Tabs
        label="Loại lịch sử"
        value={tab}
        onChange={(value) => setParams({ tab: value })}
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
                  : 'Tạo case hoặc mở một cuộc trao đổi để bắt đầu.'}
              </p>
              <Button onClick={() => setCreating(true)}>Tạo case</Button>
            </div>
          )}
        </section>
      )}
      <CreateCaseDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
