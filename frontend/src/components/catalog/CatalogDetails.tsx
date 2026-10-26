import { useState } from 'react';
import { ArrowRight, CopyPlus, Globe2, LockKeyhole, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SharedCase } from '@/types';
import { ExpertMark } from '@/components/ExpertMark';
import { Tabs } from '@/components/Tabs';
import { Badge } from '@/components/Badge';
import { Documents } from '@/components/plan/Documents';
import { formatDate } from '@/utils/format';

export function CatalogDetails({
  item,
  onClose,
}: Readonly<{ item: SharedCase; onClose: () => void }>) {
  const [tab, setTab] = useState('overview');
  const fields = [
    ['S', 'Situation · Bối cảnh', item.run.plan.context.situation],
    ['T', 'Task · Mục tiêu', item.run.plan.context.task],
    ['A', 'Action · Phương án', item.run.plan.context.action],
    ['R', 'Result · Kết quả mong muốn', item.run.plan.context.result],
  ];
  return (
    <section
      aria-label="Chi tiết case"
      className="flex max-h-[calc(100dvh-44px)] min-w-0 flex-col overflow-hidden rounded-xl border border-n2 bg-n0 xl:max-h-[var(--catalog-available-height)]"
    >
      <header className="shrink-0 p-4 pb-0">
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-n4">
          <time>{formatDate(item.publishedAt)}</time>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết case"
            className="rounded p-1 hover:bg-n1"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <h3 className="text-base font-semibold leading-6">{item.title}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-n4">
          {item.visibility === 'public' ? <Globe2 size={12} /> : <LockKeyhole size={12} />}
          {item.visibility === 'public' ? 'Công khai' : 'Được chia sẻ với bạn'} · {item.owner}
        </p>
        <div className="mt-3">
          <Tabs
            compact
            label="Nội dung case"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'overview', label: 'Tổng quan' },
              { value: 'discussion', label: 'Thảo luận' },
              { value: 'plan', label: 'Quy trình' },
              { value: 'documents', label: 'Tài liệu' },
            ]}
          />
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
        {tab === 'overview' && (
          <>
            <section>
              <h4 className="section-title mb-3">Vấn đề cần giải quyết</h4>
              <div className="space-y-4">
                {fields.map(([letter, label, value]) => (
                  <div key={letter} className="flex gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-tint-1 text-xs font-semibold text-primary">
                      {letter}
                    </span>
                    <div>
                      <h5 className="text-xs font-semibold">{label}</h5>
                      <p className="mt-1 text-xs leading-5 text-n4">
                        {value || 'Chưa có thông tin.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h4 className="section-title mb-3">
                Chuyên gia tham gia ({item.run.experts.length})
              </h4>
              <div className="flex flex-wrap gap-3">
                {item.run.experts.map((expert) => (
                  <div key={expert.id} title={expert.role} className="flex items-center gap-2">
                    <ExpertMark expert={expert} small />
                    <span className="max-w-28 text-[11px] leading-4 text-n4">{expert.role}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h4 className="section-title mb-2">Tóm tắt</h4>
              <p className="text-xs leading-6 text-n4">{item.summary}</p>
            </section>
          </>
        )}
        {tab === 'discussion' && (
          <>
            <p className="helper">
              {item.run.results.length} task có kết quả ·{' '}
              {item.run.results.reduce((sum, result) => sum + result.disagreements.length, 0)} bất
              đồng
            </p>
            {item.run.results.map((result) => (
              <article key={result.taskId} className="border-b border-n2 pb-4 last:border-0">
                <h4 className="text-sm font-semibold">{result.title}</h4>
                <p className="mt-2 text-xs leading-6 text-n4">{result.summary}</p>
                {result.rating && (
                  <div className="mt-2">
                    <Badge>{result.rating}</Badge>
                  </div>
                )}
              </article>
            ))}
          </>
        )}
        {tab === 'plan' && (
          <ol className="space-y-4">
            {item.run.plan.tasks.map((task) => (
              <li key={task.id} className="border-l-2 border-n2 pl-3">
                <span className="text-xs font-semibold text-primary">{task.id}</span>
                <h4 className="mt-1 text-sm font-semibold">{task.title}</h4>
                <p className="mt-1 text-xs leading-5 text-n4">{task.instruction}</p>
                <p className="mt-2 text-[11px] text-n4">
                  Phụ thuộc: {task.dependsOn.join(', ') || 'Task gốc'} · {task.expertIds.length}{' '}
                  expert
                </p>
              </li>
            ))}
          </ol>
        )}
        {tab === 'documents' && <Documents documents={item.run.plan.documents} />}
      </div>
      <footer className="flex shrink-0 flex-col gap-2 border-t border-n2 p-4">
        <Link
          to={`/shared/${item.id}`}
          className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-tint-2 text-xs font-semibold text-primary hover:bg-tint-3"
        >
          Xem toàn bộ case
          <ArrowRight size={14} />
        </Link>
        <Link
          to={`/cases?reference=${encodeURIComponent(item.id)}`}
          className="flex min-h-10 items-center justify-center gap-2 rounded-md text-xs font-semibold text-n4 hover:bg-n1"
        >
          <CopyPlus size={14} />
          Dùng làm context cho case mới
        </Link>
      </footer>
    </section>
  );
}
