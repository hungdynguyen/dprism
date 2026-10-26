import { useMemo, useState } from 'react';
import { ArrowRight, Check, FileText, MessageSquare, Search, X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useExperts, useSkills } from '@/hooks/useExperts';
import { useCase, useUpdateCase } from '@/hooks/useCases';
import { useChatStore } from '@/hooks/useChatStore';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { ExpertMark } from '@/components/ExpertMark';
import { Button } from '@/components/Button';
import { ErrorState, Loading } from '@/components/AsyncState';
import { matchesSearch } from '@/utils/format';
export function ExpertPickerPage() {
  const { id = '' } = useParams(),
    [params] = useSearchParams(),
    experts = useExperts(),
    skills = useSkills(),
    draft = useCase(id),
    save = useUpdateCase(id),
    navigate = useNavigate(),
    start = useChatStore((s) => s.start);
  const [search, setSearch] = useState(''),
    [domain, setDomain] = useState('all'),
    [selectedId, setSelectedId] = useState('');
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
    return <ErrorState error={experts.error || skills.error || draft.error} />;
  const selected = experts.data.find((e) => e.id === selectedId),
    returnTo = id
      ? `/cases/${id}/start`
      : params.get('returnTo') === '/cases'
        ? '/cases'
        : '/experts';
  const begin = async () => {
    if (!selected) return;
    const chatId = start({
      expert: selected,
      title: draft.data?.title,
      caseId: id || undefined,
      returnTo,
    });
    try {
      if (draft.data)
        await save.mutateAsync({
          ...draft.data,
          method: 'direct',
          chatId,
          revision: draft.data.revision + 1,
        });
      navigate(`/chats/${chatId}`);
    } catch {
      /* Remain in picker if saving fails. */
    }
  };
  return (
    <section className="mx-auto max-w-[1100px]">
      <BackLink to={returnTo}>{id ? 'Quay lại tạo case' : 'Quay lại danh sách expert'}</BackLink>
      <PageHeader
        eyebrow="Trao đổi riêng"
        title="Chọn chuyên gia"
        description="Xem chuyên môn và cách tiếp cận trước khi bắt đầu cuộc trao đổi."
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
            id="expert-picker-search"
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
      <div className="my-4 flex justify-between text-xs text-n4">
        <span role="status">
          {list.length} chuyên gia{list.length !== experts.data.length ? ' phù hợp' : ''}
        </span>
        <span className="hidden sm:inline">Mỗi cuộc trao đổi gồm một chuyên gia</span>
      </div>
      <fieldset className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <legend className="sr-only">Chọn một chuyên gia AI</legend>
        {list.map((expert) => (
          <label
            key={expert.id}
            className={`flex min-h-[275px] cursor-pointer flex-col rounded-lg border p-5 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-info ${selectedId === expert.id ? 'border-primary bg-tint-3 ring-1 ring-primary' : 'border-n2 bg-n0 hover:border-n3'}`}
          >
            <span className="mb-4 flex items-center justify-between">
              <ExpertMark expert={expert} />
              <input
                type="radio"
                name="direct-expert"
                value={expert.id}
                checked={selectedId === expert.id}
                onChange={() => setSelectedId(expert.id)}
                aria-labelledby={`expert-label-${expert.id}`}
                className="!h-[18px] !w-[18px]"
              />
            </span>
            <span className="mb-1 text-xs text-n4">{expert.domain}</span>
            <strong
              id={`expert-label-${expert.id}`}
              className="text-lg font-semibold leading-6 tracking-tight"
            >
              {expert.role}
            </strong>
            <span className="mb-4 mt-3 text-sm leading-6 text-n4">{expert.approach}</span>
            <span className="mt-auto flex flex-wrap gap-2 pb-4">
              {skills.data
                .filter((s) => expert.skillIds.includes(s.id))
                .map((s) => (
                  <span key={s.id} className="rounded bg-n1 px-2 py-1 text-xs text-n4">
                    {s.name}
                  </span>
                ))}
            </span>
            <span
              className={`flex items-center gap-2 border-t border-n2 pt-3 text-xs font-semibold ${selectedId === expert.id ? 'text-primary' : 'text-n4'}`}
            >
              {selectedId === expert.id ? (
                <>
                  <Check size={15} />
                  Đã chọn
                </>
              ) : (
                <>
                  Chọn chuyên gia
                  <ArrowRight size={15} className="ml-auto" />
                </>
              )}
            </span>
          </label>
        ))}
      </fieldset>
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
      {save.error && <ErrorState error={save.error} />}
      <footer className="sticky bottom-3 mt-6 flex items-center justify-between gap-3 rounded-lg border border-n2 bg-n0 p-3 shadow-panel sm:p-5">
        <div aria-live="polite" className="flex min-w-0 items-center gap-3">
          <span className="hidden sm:block">
            {selected ? (
              <ExpertMark expert={selected} small />
            ) : (
              <MessageSquare size={22} className="text-n4" />
            )}
          </span>
          <div className="min-w-0">
            <strong className="block text-xs font-semibold sm:text-sm">
              {selected?.role || 'Chưa chọn chuyên gia'}
            </strong>
            <span className="hidden text-xs text-n4 sm:block">
              {selected
                ? `${selected.domain} · Đã chọn 1 chuyên gia`
                : 'Chọn một chuyên gia ở phía trên.'}
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          disabled={!selected || save.isPending}
          onClick={() => void begin()}
          className="shrink-0 !px-3 !text-xs sm:!text-sm"
        >
          Bắt đầu trao đổi
          <ArrowRight size={15} />
        </Button>
      </footer>
    </section>
  );
}
