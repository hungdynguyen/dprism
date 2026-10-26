import { Search } from 'lucide-react';
import { useState } from 'react';
import { useExperts, useSkills } from '@/hooks/useExperts';
import { ExpertCard } from '@/components/ExpertCard';
import { StartExpertChatDialog } from '@/components/StartExpertChatDialog';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { ErrorState, Loading } from '@/components/AsyncState';
import { matchesSearch } from '@/utils/format';
import type { Expert } from '@/types';

export function ExpertsPage() {
  const query = useExperts(),
    skills = useSkills();
  const [search, setSearch] = useState(''),
    [domain, setDomain] = useState('all');
  const [chatExpert, setChatExpert] = useState<Expert | null>(null);
  if (query.isPending || skills.isPending) return <Loading />;
  if (query.error || skills.error)
    return (
      <ErrorState
        error={query.error || skills.error}
        retry={() => {
          void query.refetch();
          void skills.refetch();
        }}
      />
    );
  const experts = query.data.filter(
    (e) =>
      (domain === 'all' || e.domain === domain) &&
      matchesSearch(
        [
          e.role,
          e.domain,
          e.approach,
          ...skills.data.filter((s) => e.skillIds.includes(s.id)).map((s) => s.name),
        ].join(' '),
        search,
      ),
  );
  return (
    <>
      <PageHeader
        eyebrow="EXPERT WORKSPACE"
        title="Chuyên gia AI"
        description="Tìm góc nhìn chuyên môn phù hợp và bắt đầu trao đổi về vấn đề của bạn."
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 max-w-md flex-1">
          <Search size={17} className="absolute left-3 top-3 text-n4" />
          <input
            aria-label="Tìm chuyên gia"
            placeholder="Tìm theo tên hoặc chuyên môn…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-10"
          />
        </div>
        <select
          aria-label="Lọc lĩnh vực"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="!w-auto"
        >
          <option value="all">Tất cả lĩnh vực</option>
          {[...new Set(query.data.map((e) => e.domain))].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <span role="status" className="text-xs text-n4">
          {experts.length} chuyên gia
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {experts.map((expert) => (
          <ExpertCard
            key={expert.id}
            expert={expert}
            skills={skills.data}
            onChat={() => setChatExpert(expert)}
          />
        ))}
      </div>
      {!experts.length && (
        <Card className="py-12 text-center text-n4">Không tìm thấy chuyên gia phù hợp.</Card>
      )}
      {chatExpert && (
        <StartExpertChatDialog expert={chatExpert} onClose={() => setChatExpert(null)} />
      )}
    </>
  );
}
