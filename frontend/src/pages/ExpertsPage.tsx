import { ArrowRight, MessageSquare, Plus, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useExperts } from '@/hooks/useExperts';
import { useChatStore } from '@/hooks/useChatStore';
import { ExpertMark } from '@/components/ExpertMark';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ErrorState, Loading } from '@/components/AsyncState';
import { matchesSearch } from '@/utils/format';
export function ExpertsPage() {
  const query = useExperts(),
    [search, setSearch] = useState(''),
    [domain, setDomain] = useState('all'),
    navigate = useNavigate();
  const start = useChatStore((s) => s.start);
  if (query.isPending) return <Loading />;
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const experts = query.data.filter(
    (e) =>
      (domain === 'all' || e.domain === domain) &&
      matchesSearch(`${e.role} ${e.domain} ${e.approach}`, search),
  );
  return (
    <>
      <PageHeader
        eyebrow="EXPERT WORKSPACE"
        title="Chuyên gia AI"
        description="Xây dựng đội ngũ chuyên môn phù hợp với công việc của bạn."
        action={
          <Link
            to="/experts/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-n0"
          >
            <Plus size={17} />
            Tạo expert
          </Link>
        }
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
        <span className="text-xs text-n4">{experts.length} chuyên gia</span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {experts.map((expert) => (
          <Card key={expert.id} className="flex flex-col">
            <div className="mb-5 flex items-center gap-3">
              <ExpertMark expert={expert} />
              <div>
                <Link to={`/experts/${expert.id}`} className="font-semibold hover:text-primary">
                  {expert.role}
                </Link>
                <p className="text-xs text-n4">{expert.domain}</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-n4">{expert.approach}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-n2 pt-4">
              <Button onClick={() => navigate(`/chats/${start({ expert })}`)}>
                <MessageSquare size={15} />
                Trao đổi riêng
              </Button>
              <button
                className="text-xs font-medium text-n4 underline"
                aria-label={`Tạo cuộc trao đổi mới với ${expert.role}`}
                onClick={() => navigate(`/chats/${start({ expert, forceNew: true })}`)}
              >
                Mới
              </button>
              <Link
                to={`/experts/${expert.id}`}
                className="inline-flex items-center gap-2 text-xs font-medium text-n4 hover:text-primary"
              >
                Xem hồ sơ
                <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        ))}
      </div>
      {!experts.length && (
        <Card className="py-12 text-center text-n4">Không tìm thấy chuyên gia phù hợp.</Card>
      )}
    </>
  );
}
