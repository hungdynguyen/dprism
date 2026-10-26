import { useState } from 'react';
import type { Run } from '@/types';
import { buildArguments } from '@/utils/results';
import { ExpertMark } from '@/components/ExpertMark';
import { Tabs } from '@/components/Tabs';
import { ArgumentMap } from '@/components/results/ArgumentMap';
import { ResultInspector } from '@/components/results/ResultInspector';
export function ResultsBoard({ run }: Readonly<{ run: Run }>) {
  const items = buildArguments(run),
    [selectedId, setSelectedId] = useState(items[0]?.id || ''),
    [expertId, setExpertId] = useState(''),
    [tab, setTab] = useState('graph'),
    [feed, setFeed] = useState('all');
  const selected = items.find((a) => a.id === selectedId) || items[0],
    result = run.results.find((r) => r.taskId === selected?.taskId);
  const views = run.results
    .flatMap((r) => r.views.map((v) => ({ result: r, view: v })))
    .filter(
      ({ result: r, view: v }) =>
        (!expertId || v.expertId === expertId) &&
        (feed !== 'selected' || r.taskId === selected?.taskId),
    );
  const select = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 1279px)').matches) setTab('details');
  };
  return (
    <>
      <div className="xl:hidden">
        <Tabs
          label="Panel kết quả"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'graph', label: 'Bản đồ' },
            { value: 'details', label: 'Chi tiết' },
            { value: 'people', label: 'Chuyên gia' },
          ]}
        />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[180px_minmax(0,1fr)_310px]">
        <aside
          className={`${tab === 'people' ? 'flex' : 'hidden xl:flex'} min-h-0 flex-col overflow-y-auto rounded-lg border border-n2 bg-n0 p-4`}
        >
          <h2 className="section-title mb-4">Participants ({run.experts.length})</h2>
          <button
            onClick={() => setExpertId('')}
            className={`mb-3 rounded px-2 py-2 text-left text-xs ${!expertId ? 'bg-tint-1 font-semibold text-primary' : 'text-n4'}`}
          >
            Tất cả chuyên gia
          </button>
          {run.experts.map((expert) => (
            <button
              key={expert.id}
              aria-pressed={expertId === expert.id}
              onClick={() => {
                const next = expertId === expert.id ? '' : expert.id;
                setExpertId(next);
                const first = items.find((a) => a.expertIds.includes(next));
                if (first) setSelectedId(first.id);
              }}
              className={`mb-2 flex items-center gap-2 rounded-md p-2 text-left ${expertId === expert.id ? 'bg-tint-1' : 'hover:bg-n1'}`}
            >
              <ExpertMark expert={expert} small />
              <span className="text-xs font-medium leading-5">{expert.role}</span>
            </button>
          ))}
          <div className="mt-5 border-t border-n2 pt-4">
            <h3 className="section-title">Tổng quan thảo luận</h3>
            <p className="helper mt-3">{run.results.length} task đã tạo kết quả</p>
            <p className="helper">
              {items.filter((a) => a.dissent).length} bất đồng còn được ghi nhận
            </p>
          </div>
        </aside>
        <div
          className={`${tab === 'graph' ? 'grid' : 'hidden xl:grid'} min-h-0 grid-rows-[minmax(140px,1fr)_144px] gap-3`}
        >
          <ArgumentMap
            title={run.title}
            arguments={items}
            selectedId={selected?.id || ''}
            expertId={expertId}
            onSelect={select}
          />
          <section className="task-panel">
            <header className="panel-heading !px-4 !py-2">
              <h2 className="section-title">Ý kiến chuyên gia</h2>
              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => setFeed('all')}
                  className={feed === 'all' ? 'font-semibold text-primary' : 'text-n4'}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFeed('selected')}
                  className={feed === 'selected' ? 'font-semibold text-primary' : 'text-n4'}
                >
                  Luận điểm này
                </button>
              </div>
            </header>
            <div className="flex min-h-0 gap-3 overflow-x-auto p-3">
              {views.map(({ result: r, view }) => (
                <button
                  key={`${r.taskId}-${view.expertId}`}
                  onClick={() => setSelectedId(r.taskId)}
                  className="w-64 shrink-0 rounded-md border border-n2 bg-n1/40 p-2 text-left"
                >
                  <strong className="block truncate text-xs font-semibold">
                    {run.experts.find((e) => e.id === view.expertId)?.role}
                  </strong>
                  <p className="mt-2 line-clamp-1 text-xs leading-5 text-n4">{view.text}</p>
                  <span className="mt-2 block text-[11px] text-n4">
                    {r.taskId} · {view.finalRating || 'Theo đầu ra của plan'}
                  </span>
                </button>
              ))}
              {!views.length && <p className="helper p-3">Chưa có ý kiến phù hợp bộ lọc.</p>}
            </div>
          </section>
        </div>
        <aside
          className={`${tab === 'details' ? 'block' : 'hidden xl:block'} min-h-0 overflow-y-auto rounded-lg border border-n2 bg-n0`}
        >
          <div className="border-b border-n2 px-5 py-3">
            <h2 className="section-title">Chi tiết luận điểm</h2>
            <select
              aria-label="Chọn luận điểm"
              className="mt-3"
              value={selected?.id || ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <ResultInspector key={result?.taskId} result={result} run={run} />
        </aside>
      </div>
    </>
  );
}
