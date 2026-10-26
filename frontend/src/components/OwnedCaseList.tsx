import { FileText, MessageSquare, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { formatDate, matchesSearch } from '@/utils/format';
import type { OwnedCaseRow } from '@/utils/ownedCases';

export function OwnedCaseList({ rows }: Readonly<{ rows: OwnedCaseRow[] }>) {
  const [search, setSearch] = useState('');
  const filtered = rows.filter((row) =>
    matchesSearch(`${row.title} ${row.subtitle} ${row.kind}`, search),
  );
  return (
    <section aria-label="Case của tôi">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Case gần đây <span className="ml-2 text-sm font-normal text-n4">{rows.length}</span>
        </h2>
        <div className="relative w-full sm:max-w-sm">
          <Search size={17} className="absolute left-3 top-3 text-n4" />
          <input
            aria-label="Tìm trong lịch sử"
            className="!pl-10"
            placeholder="Tìm tên case, chuyên gia…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-n2 bg-n0">
        {filtered.map((row) => (
          <article
            key={row.id}
            className="flex flex-wrap items-center gap-4 border-b border-n2 p-5 last:border-0"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-n1 text-n4">
              {row.direct ? <MessageSquare size={18} /> : <FileText size={18} />}
            </span>
            <div className="min-w-0 basis-48 flex-1">
              <Link to={row.to} className="break-words font-semibold hover:text-primary">
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
        {!filtered.length && (
          <div className="px-6 py-12 text-center">
            <h3 className="font-semibold">{search ? 'Không tìm thấy case' : 'Chưa có case nào'}</h3>
            <p className="mt-2 text-sm text-n4">
              {search
                ? 'Thử tên case hoặc chuyên gia khác.'
                : 'Chọn cách bắt đầu ở phía trên. Cả thảo luận và trao đổi riêng đều được lưu tại đây.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
