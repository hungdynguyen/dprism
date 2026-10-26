import { useMemo, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useExperts, useSkills } from '@/hooks/useExperts';
import { useCase } from '@/hooks/useCases';
import { useStartExpertChat } from '@/hooks/useStartExpertChat';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { ExpertCard } from '@/components/ExpertCard';
import { StartExpertChatDialog } from '@/components/StartExpertChatDialog';
import { Button } from '@/components/Button';
import { ErrorState, Loading } from '@/components/AsyncState';
import { matchesSearch } from '@/utils/format';
import type { Expert } from '@/types';

export function ExpertPickerPage() {
  const { id = '' } = useParams(),
    [params] = useSearchParams();
  const experts = useExperts(),
    skills = useSkills(),
    draft = useCase(id);
  const start = useStartExpertChat(),
    navigate = useNavigate();
  const [search, setSearch] = useState(''),
    [domain, setDomain] = useState('all');
  const [chatExpert, setChatExpert] = useState<Expert | null>(null);
  const list = useMemo(
    () =>
      (experts.data || []).filter(
        (e) =>
          (domain === 'all' || e.domain === domain) &&
          matchesSearch(
            [
              e.role,
              e.domain,
              e.approach,
              ...(skills.data || []).filter((s) => e.skillIds.includes(s.id)).map((s) => s.name),
            ].join(' '),
            search,
          ),
      ),
    [experts.data, skills.data, search, domain],
  );
  if (experts.isPending || skills.isPending || (id && draft.isPending)) return <Loading />;
  if (experts.error || skills.error || draft.error)
    return (
      <ErrorState
        error={experts.error || skills.error || draft.error}
        retry={() => {
          void experts.refetch();
          void skills.refetch();
          if (id) void draft.refetch();
        }}
      />
    );
  const returnTo = id ? '/cases' : params.get('returnTo') === '/cases' ? '/cases' : '/experts';
  const begin = async (expert: Expert) => {
    if (!draft.data) {
      setChatExpert(expert);
      return;
    }
    try {
      const { chatId } = await start.mutateAsync({ draft: draft.data, expert });
      navigate(`/chats/${chatId}`);
    } catch {
      /* The action remains available for retry. */
    }
  };
  return (
    <section className="mx-auto max-w-[1100px]">
      <BackLink to={returnTo}>
        {returnTo === '/cases' ? 'Quay lại Cases' : 'Quay lại danh sách expert'}
      </BackLink>
      <PageHeader
        eyebrow="Trao đổi riêng"
        title="Bạn muốn trao đổi với ai?"
        description="Chọn chuyên gia phù hợp và bắt đầu cuộc trò chuyện."
      />
      {draft.data && (
        <p className="-mt-3 mb-5 flex items-center gap-2 text-xs text-n4">
          <FileText size={14} />
          {draft.data.title}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-3 text-n4" />
          <input
            aria-label="Tìm theo tên, chuyên môn hoặc kỹ năng"
            placeholder="Tìm theo tên, chuyên môn hoặc kỹ năng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-10 !pr-10"
          />
          {search && (
            <button
              aria-label="Xóa từ khóa"
              className="absolute right-3 top-3 text-n4"
              onClick={() => setSearch('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <select
          aria-label="Lọc theo lĩnh vực"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        >
          <option value="all">Tất cả lĩnh vực</option>
          {[...new Set(experts.data.map((e) => e.domain))].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <p role="status" className="my-4 text-xs text-n4">
        {list.length} chuyên gia{list.length !== experts.data.length ? ' phù hợp' : ''}
      </p>
      {start.error && (
        <div className="mb-4">
          <ErrorState error={start.error} />
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((expert) => (
          <ExpertCard
            key={expert.id}
            expert={expert}
            skills={skills.data}
            onChat={() => void begin(expert)}
            disabled={start.isPending}
            busy={start.isPending && start.variables?.expert.id === expert.id}
            profileReturnTo={
              id
                ? `/cases/${id}/experts`
                : `/experts/select${params.size ? `?${params.toString()}` : ''}`
            }
          />
        ))}
      </div>
      {!list.length && (
        <div className="rounded-lg border border-dashed border-n3 py-12 text-center">
          <h2 className="font-semibold">Chưa tìm thấy chuyên gia phù hợp</h2>
          <p className="my-3 text-n4">Thử từ khóa khác hoặc xem lại tất cả lĩnh vực.</p>
          <Button
            onClick={() => {
              setSearch('');
              setDomain('all');
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      )}
      {chatExpert && (
        <StartExpertChatDialog
          expert={chatExpert}
          referenceCaseIds={params.getAll('reference')}
          onClose={() => setChatExpert(null)}
        />
      )}
    </section>
  );
}
