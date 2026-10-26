import { useEffect, useRef, useState } from 'react';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { Argument } from '@/utils/results';
export function ArgumentMap({
  title,
  arguments: items,
  selectedId,
  expertId,
  onSelect,
}: Readonly<{
  title: string;
  arguments: Argument[];
  selectedId: string;
  expertId: string;
  onSelect: (id: string) => void;
}>) {
  const viewport = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [size, setSize] = useState({ width: 750, height: 440 }),
    [view, setView] = useState<{ zoom: number; x: number; y: number } | null>(null);
  const width = 1000,
    height = Math.max(360, Math.ceil(items.length / 2) * 94 + 16);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: el.clientWidth, height: el.clientHeight }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const fit = Math.max(0.2, Math.min(1.1, (size.width - 16) / width, (size.height - 16) / height));
  const scale = view?.zoom ?? Math.max(0.8, fit),
    x = view?.x ?? (size.width - width * scale) / 2,
    y = view?.y ?? (size.height - height * scale) / 2;
  const changeZoom = (factor: number) => {
    const zoom = Math.max(0.2, Math.min(2, scale * factor));
    setView({
      zoom,
      x: size.width / 2 - ((size.width / 2 - x) * zoom) / scale,
      y: size.height / 2 - ((size.height / 2 - y) * zoom) / scale,
    });
  };
  const positions = items.map((item, i) => {
    const side = i % 2,
      count = Math.ceil((items.length - side) / 2);
    return { item, x: side ? 716 : 24, y: (height - count * 94) / 2 + Math.floor(i / 2) * 94 };
  });
  return (
    <section className="task-panel">
      <header className="panel-heading !px-4">
        <h2 className="section-title">Argument map</h2>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            aria-label="Thu nhỏ bản đồ"
            onClick={() => changeZoom(1 / 1.2)}
            className="rounded p-1"
          >
            <Minus size={15} />
          </button>
          <span className="w-10 text-center text-xs text-n4">{Math.round(scale * 100)}%</span>
          <button
            aria-label="Phóng to bản đồ"
            onClick={() => changeZoom(1.2)}
            className="rounded p-1"
          >
            <Plus size={15} />
          </button>
          <button
            aria-label="Fit bản đồ"
            onClick={() =>
              setView({
                zoom: fit,
                x: (size.width - width * fit) / 2,
                y: (size.height - height * fit) / 2,
              })
            }
            className="rounded p-1"
          >
            <Maximize size={15} />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:hidden">
        <div className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-n0">{title}</div>
        <div className="ml-3 space-y-3 border-l-2 border-n2 py-4 pl-4">
          {items.map((item) => (
            <button
              key={item.id}
              aria-pressed={selectedId === item.id}
              onClick={() => onSelect(item.id)}
              className={`relative block w-full rounded-lg border p-3 text-left before:absolute before:-left-[18px] before:top-6 before:w-4 before:border-t-2 before:border-n2 ${selectedId === item.id ? 'border-primary bg-tint-3' : 'border-n2 bg-n0'} ${expertId && !item.expertIds.includes(expertId) ? 'opacity-40' : ''}`}
            >
              <span
                className={`mb-1 block text-xs ${item.dissent ? 'text-warning' : 'text-success'}`}
              >
                {item.dissent ? 'Bất đồng' : 'Kết luận'} · {item.taskId}
              </span>
              <strong className="text-sm font-semibold leading-6">{item.title}</strong>
            </button>
          ))}
          {!items.length && <p className="text-sm text-n4">Chưa có task hoàn tất.</p>}
        </div>
      </div>
      <div
        ref={viewport}
        className="relative hidden min-h-0 flex-1 touch-none overflow-hidden bg-n1/50 sm:block"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button') || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, ox: x, oy: y };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (start)
            setView({
              zoom: scale,
              x: start.ox + event.clientX - start.x,
              y: start.oy + event.clientY - start.y,
            });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="absolute origin-top-left"
          style={{ width, height, transform: `translate(${x}px, ${y}px) scale(${scale})` }}
        >
          <svg width={width} height={height} aria-hidden="true" className="absolute">
            {positions.map((p) => (
              <path
                key={p.item.id}
                d={
                  p.x < 365
                    ? `M284 ${p.y + 43} C320 ${p.y + 43},330 ${height / 2},365 ${height / 2}`
                    : `M635 ${height / 2} C670 ${height / 2},680 ${p.y + 43},716 ${p.y + 43}`
                }
                fill="none"
                stroke="currentColor"
                className={p.item.dissent ? 'text-warning/50' : 'text-success/40'}
                strokeWidth={1.5}
              />
            ))}
          </svg>
          <div
            className="absolute flex min-h-24 w-[270px] flex-col justify-center rounded-lg border border-tint-2 bg-primary px-5 py-4 text-center text-n0"
            style={{ left: 365, top: height / 2 - 48 }}
          >
            <span className="mb-2 text-xs opacity-80">{items.length} luận điểm</span>
            <h3 className="line-clamp-3 text-lg font-semibold leading-6">{title}</h3>
          </div>
          {positions.map((p) => (
            <button
              key={p.item.id}
              aria-pressed={selectedId === p.item.id}
              onClick={() => onSelect(p.item.id)}
              onFocus={(event) => {
                const rect = event.currentTarget.getBoundingClientRect(),
                  box = viewport.current?.getBoundingClientRect();
                if (
                  box &&
                  (rect.left < box.left ||
                    rect.right > box.right ||
                    rect.top < box.top ||
                    rect.bottom > box.bottom)
                )
                  setView({
                    zoom: scale,
                    x: size.width / 2 - (p.x + 130) * scale,
                    y: size.height / 2 - (p.y + 43) * scale,
                  });
              }}
              className={`absolute h-[86px] w-[260px] overflow-hidden rounded-lg border bg-n0 p-3 text-left ${selectedId === p.item.id ? 'border-primary ring-1 ring-primary' : 'border-n2'} ${expertId && !p.item.expertIds.includes(expertId) ? 'opacity-40' : ''}`}
              style={{ left: p.x, top: p.y }}
            >
              <span
                className={`mb-1 block text-[11px] leading-4 font-semibold ${p.item.dissent ? 'text-warning' : 'text-success'}`}
              >
                {p.item.dissent ? 'Bất đồng' : 'Kết luận'} · {p.item.taskId}
              </span>
              <strong className="line-clamp-2 text-[15px] font-semibold leading-5">
                {p.item.title}
              </strong>
            </button>
          ))}
        </div>
        {!items.length && (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-n4">
            Chưa có task hoàn tất để tạo luận điểm.
          </p>
        )}
      </div>
      <div className="flex gap-4 border-t border-n2 px-4 py-2 text-[11px] text-n4">
        <span className="text-success">● Kết luận</span>
        <span className="text-warning">● Bất đồng</span>
        <span className="ml-auto hidden sm:inline">Kéo nền để di chuyển</span>
        <span className="ml-auto sm:hidden">Chọn nhánh để xem chi tiết</span>
      </div>
    </section>
  );
}
