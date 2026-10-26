import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Grid2X2, Globe2, List, LockKeyhole, Search, SlidersHorizontal, X } from 'lucide-react';
import type { SharedCase } from '@/types';
import { ExpertMark } from '@/components/ExpertMark';
import { Badge } from '@/components/Badge';
import { CatalogDetails } from '@/components/catalog/CatalogDetails';
import { CatalogFiltersPanel } from '@/components/catalog/CatalogFiltersPanel';
import { emptyCatalogFilters, filterCatalog } from '@/utils/caseCatalog';
import type { CatalogFilters } from '@/utils/caseCatalog';
import { formatDate } from '@/utils/format';

export function CaseCatalog({
  items,
  collection,
}: Readonly<{ items: SharedCase[]; collection: 'received' | 'public' }>) {
  const [filters, setFilters] = useState<CatalogFilters>(emptyCatalogFilters);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [showFilters, setShowFilters] = useState(false);
  const grid = useRef<HTMLDivElement>(null),
    details = useRef<HTMLDivElement>(null),
    opener = useRef<HTMLButtonElement | null>(null);
  const filtered = useMemo(() => filterCatalog(items, filters), [items, filters]);
  const selected = filtered.find((item) => item.id === selectedId);
  const activeFilters =
    filters.domains.length +
    filters.expertIds.length +
    filters.decisionTypes.length +
    (filters.time === 'all' ? 0 : 1);
  const update = (patch: Partial<CatalogFilters>) => setFilters((old) => ({ ...old, ...patch }));
  const reset = () => setFilters(emptyCatalogFilters);
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    const measure = () =>
      element.style.setProperty(
        '--catalog-available-height',
        `${Math.max(320, window.innerHeight - Math.max(20, element.getBoundingClientRect().top) - 24)}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, []);
  const closeDetails = () => {
    setSelectedId('');
    opener.current?.focus();
  };
  return (
    <section aria-label={collection === 'public' ? 'Library' : 'Case được chia sẻ với tôi'}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            {collection === 'public' ? (
              <Globe2 size={20} className="text-primary" />
            ) : (
              <LockKeyhole size={20} className="text-primary" />
            )}
            {collection === 'public' ? 'Library' : 'Case được chia sẻ với tôi'}
          </h2>
          <p className="mt-1 text-sm text-n4">
            {collection === 'public'
              ? 'Khám phá các case được công khai để mọi người cùng tham khảo và tái sử dụng.'
              : 'Các case được người khác chia sẻ trực tiếp với bạn, không xuất hiện trong Library.'}
          </p>
        </div>
      </header>
      <div
        ref={grid}
        className={`grid items-start gap-5 lg:grid-cols-[180px_minmax(0,1fr)] ${selected ? 'xl:grid-cols-[170px_minmax(0,1fr)_300px]' : ''}`}
      >
        <aside className="lg:sticky lg:top-5 lg:max-h-[var(--catalog-available-height)] lg:overflow-y-auto">
          <button
            type="button"
            className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-n2 bg-n0 px-3 text-sm lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} />
            Bộ lọc{activeFilters > 0 && ` (${activeFilters})`}
          </button>
          <div className={showFilters ? 'block' : 'hidden lg:block'}>
            <CatalogFiltersPanel
              items={items}
              filters={filters}
              onChange={update}
              onReset={reset}
            />
          </div>
        </aside>
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative min-w-40 flex-1">
              <Search size={16} className="absolute left-3 top-3 text-n4" />
              <input
                aria-label="Tìm case trong bộ sưu tập"
                value={filters.search}
                onChange={(event) => update({ search: event.target.value })}
                className="!pl-9 !pr-9"
                placeholder="Tìm case, chủ đề, chuyên gia…"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => update({ search: '' })}
                  aria-label="Xóa tìm kiếm case"
                  className="absolute right-3 top-3 text-n4"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <select
              aria-label="Sắp xếp case"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as CatalogFilters['sort'] })}
              className="!w-auto !text-xs"
            >
              <option value="recent">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="title">Tên A–Z</option>
            </select>
            <div
              className="inline-flex rounded-md border border-n2 bg-n0 p-1"
              role="group"
              aria-label="Cách hiển thị case"
            >
              {(
                [
                  { id: 'grid', label: 'Dạng lưới', icon: Grid2X2 },
                  { id: 'list', label: 'Dạng danh sách', icon: List },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  aria-label={label}
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                  className={`grid h-8 w-8 place-items-center rounded ${view === id ? 'bg-primary text-n0' : 'text-n4 hover:bg-n1'}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between gap-3 text-xs text-n4">
            <span role="status">
              {filtered.length} / {items.length} case
            </span>
            {activeFilters > 0 && (
              <button onClick={reset} className="font-medium text-primary">
                Xóa {activeFilters} bộ lọc
              </button>
            )}
          </div>
          <div
            className={
              view === 'grid'
                ? `grid gap-4 md:grid-cols-2 ${selected ? '2xl:grid-cols-3' : 'xl:grid-cols-3'}`
                : 'space-y-3'
            }
          >
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Xem chi tiết ${item.title}`}
                aria-pressed={selectedId === item.id}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setSelectedId(item.id);
                  if (window.matchMedia('(max-width: 1279px)').matches)
                    requestAnimationFrame(() => {
                      details.current?.scrollIntoView({
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                          ? 'auto'
                          : 'smooth',
                        block: 'start',
                      });
                      details.current?.focus({ preventScroll: true });
                    });
                }}
                className={`flex w-full flex-col rounded-xl border bg-n0 p-4 text-left transition-colors ${selectedId === item.id ? 'border-primary' : 'border-n2 hover:border-n3'} ${view === 'list' ? 'sm:flex-row sm:items-center sm:gap-4' : 'h-full min-h-60'}`}
              >
                <div className="min-w-0 flex-1">
                  <time className="text-[11px] text-n4">{formatDate(item.publishedAt)}</time>
                  <div className="my-2 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold leading-6">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-n4">{item.summary}</p>
                </div>
                <div
                  className={`mt-auto ${view === 'list' ? 'shrink-0 pt-3 sm:max-w-40 sm:pt-0' : 'pt-4'}`}
                >
                  <div className="flex items-center gap-1.5">
                    {item.run.experts.slice(0, 3).map((expert) => (
                      <ExpertMark key={expert.id} expert={expert} small />
                    ))}
                    {item.run.experts.length > 3 && (
                      <span className="text-[11px] text-n4">+{item.run.experts.length - 3}</span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-n4">{item.owner}</p>
                </div>
              </button>
            ))}
          </div>
          {!filtered.length && (
            <div className="rounded-xl border border-dashed border-n3 px-5 py-12 text-center">
              <h3 className="font-semibold">
                {items.length
                  ? 'Không tìm thấy case phù hợp'
                  : collection === 'public'
                    ? 'Library chưa có case công khai'
                    : 'Chưa có case được chia sẻ với bạn'}
              </h3>
              <p className="mt-2 text-sm text-n4">
                {items.length
                  ? 'Thử từ khóa khác hoặc đặt lại bộ lọc.'
                  : collection === 'public'
                    ? 'Case được chủ sở hữu công khai sẽ xuất hiện tại đây.'
                    : 'Các case được chia sẻ trực tiếp sẽ xuất hiện tại đây.'}
              </p>
              {items.length > 0 && (
                <button onClick={reset} className="mt-4 min-h-10 font-semibold text-primary">
                  Đặt lại tìm kiếm và bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
        {selected && (
          <div
            ref={details}
            tabIndex={-1}
            className="scroll-mt-5 lg:col-start-2 xl:sticky xl:top-5 xl:col-start-auto"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                closeDetails();
              }
            }}
          >
            <CatalogDetails key={selected.id} item={selected} onClose={closeDetails} />
          </div>
        )}
      </div>
    </section>
  );
}
