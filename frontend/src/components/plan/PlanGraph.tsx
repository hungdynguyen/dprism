import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, Maximize, Minus, Plus, Users } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { graphLayout } from '@/utils/plan';
import { isActiveTask, TASK_STATUS } from '@/utils/runStatus';
import { Badge } from '@/components/Badge';

export function PlanGraph({
  tasks,
  selectedId,
  onSelect,
  statuses,
  onAdd,
}: Readonly<{
  tasks: Task[];
  selectedId: string;
  onSelect: (id: string) => void;
  statuses?: Record<string, TaskStatus>;
  onAdd?: () => void;
}>) {
  const graph = useMemo(() => graphLayout(tasks), [tasks]),
    viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 700, height: 300 }),
    [auto, setAuto] = useState(true),
    [fitAll, setFitAll] = useState(false);
  const [manual, setManual] = useState({ zoom: 1, x: 0, y: 0 });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: element.clientWidth, height: element.clientHeight }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const zoom = Math.max(
    fitAll ? 0.2 : 0.8,
    Math.min(1, (size.width - 24) / graph.width, (size.height - 18) / graph.height),
  );
  const view = auto
    ? { zoom, x: (size.width - graph.width * zoom) / 2, y: (size.height - graph.height * zoom) / 2 }
    : manual;
  const zoomBy = (factor: number) => {
    const next = Math.max(0.2, Math.min(2, view.zoom * factor));
    setManual({
      zoom: next,
      x: size.width / 2 - ((size.width / 2 - view.x) * next) / view.zoom,
      y: size.height / 2 - ((size.height / 2 - view.y) * next) / view.zoom,
    });
    setAuto(false);
  };
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = Math.max(0.2, Math.min(2, view.zoom * (event.deltaY > 0 ? 0.92 : 1.08)));
      setManual({
        zoom: next,
        x: size.width / 2 - ((size.width / 2 - view.x) * next) / view.zoom,
        y: size.height / 2 - ((size.height / 2 - view.y) * next) / view.zoom,
      });
      setAuto(false);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [size, view.zoom, view.x, view.y]);
  return (
    <section className="task-panel">
      <div className="panel-heading">
        <div className="flex items-center gap-3">
          <h2 className="section-title">Plan DAG</h2>
          <span className="text-xs text-n4">{tasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
            <button
              className="mr-2 flex items-center gap-1 text-xs font-semibold text-primary"
              onClick={onAdd}
            >
              <Plus size={14} />
              Thêm task
            </button>
          )}
          <button
            aria-label="Thu nhỏ DAG"
            onClick={() => zoomBy(1 / 1.2)}
            className="rounded p-1 hover:bg-n1"
          >
            <Minus size={15} />
          </button>
          <span className="w-10 text-center text-xs text-n4">{Math.round(view.zoom * 100)}%</span>
          <button
            aria-label="Phóng to DAG"
            onClick={() => zoomBy(1.2)}
            className="rounded p-1 hover:bg-n1"
          >
            <Plus size={15} />
          </button>
          <button
            aria-label="Hiển thị toàn bộ DAG"
            onClick={() => {
              setFitAll(true);
              setAuto(true);
            }}
            className="rounded p-1 hover:bg-n1"
          >
            <Maximize size={15} />
          </button>
        </div>
      </div>
      <div
        ref={viewport}
        className="relative min-h-0 flex-1 touch-none overflow-hidden bg-n1/60"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button') || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            originX: view.x,
            originY: view.y,
          };
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || current.id !== event.pointerId) return;
          setManual({
            zoom: view.zoom,
            x: current.originX + event.clientX - current.x,
            y: current.originY + event.clientY - current.y,
          });
          setAuto(false);
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
          style={{
            width: graph.width,
            height: graph.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          }}
        >
          <svg
            width={graph.width}
            height={graph.height}
            className="pointer-events-none absolute text-n3"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="dag-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8" fill="currentColor" />
              </marker>
            </defs>
            {graph.nodes.flatMap((node) =>
              node.task.dependsOn.map((id) => {
                const from = graph.nodes.find((n) => n.task.id === id);
                if (!from) return null;
                return (
                  <path
                    key={`${id}-${node.task.id}`}
                    d={`M${from.x + 242} ${from.y + 43} C${from.x + 270} ${from.y + 43},${node.x - 28} ${node.y + 43},${node.x} ${node.y + 43}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    markerEnd="url(#dag-arrow)"
                  />
                );
              }),
            )}
          </svg>
          {graph.nodes.map(({ task, x, y }) => {
            const status = statuses?.[task.id],
              active = status && isActiveTask(status);
            return (
              <button
                key={task.id}
                onClick={() => onSelect(task.id)}
                onFocus={(event) => {
                  const node = event.currentTarget.getBoundingClientRect(),
                    box = viewport.current?.getBoundingClientRect();
                  if (
                    box &&
                    (node.left < box.left ||
                      node.right > box.right ||
                      node.top < box.top ||
                      node.bottom > box.bottom)
                  ) {
                    setManual({
                      zoom: view.zoom,
                      x: size.width / 2 - (x + 121) * view.zoom,
                      y: size.height / 2 - (y + 43) * view.zoom,
                    });
                    setAuto(false);
                  }
                }}
                aria-pressed={selectedId === task.id}
                className={`absolute w-[242px] rounded-lg border bg-n0 p-4 text-left shadow-sm transition-colors duration-200 ${selectedId === task.id ? 'border-primary ring-1 ring-primary' : 'border-n2'} ${active ? 'bg-tint-3' : ''}`}
                style={{ left: x, top: y }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-n4">{task.id}</span>
                  <span className="flex items-center gap-1 text-xs text-n4">
                    {statuses && (
                      <span className="mr-1 inline-flex h-4 w-4 items-center justify-center text-primary">
                        {active && (
                          <LoaderCircle
                            size={14}
                            aria-hidden="true"
                            className="animate-spin motion-reduce:animate-none"
                          />
                        )}
                      </span>
                    )}
                    <Users size={13} />
                    {task.expertIds.length}
                  </span>
                </div>
                <h3 className="text-sm font-semibold leading-5">{task.title}</h3>
                {status && (
                  <div className="mt-3 min-h-7">
                    <Badge tone={TASK_STATUS[status].tone}>{TASK_STATUS[status].label}</Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {!tasks.length && (
          <p className="absolute inset-0 grid place-items-center text-sm text-n4">
            Thêm task đầu tiên để thiết kế plan.
          </p>
        )}
      </div>
      <div className="border-t border-n2 px-4 py-2 text-[11px] text-n4">
        Chọn task để xem chi tiết · Kéo nền để di chuyển · Cuộn để zoom
      </div>
    </section>
  );
}
