import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: Readonly<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}>) {
  const ref = useRef<HTMLDialogElement>(null),
    closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null,
      root = document.getElementById('root');
    if (root) root.inert = true;
    const timer = requestAnimationFrame(() =>
      (
        ref.current?.querySelector<HTMLElement>('input,textarea,select') ||
        ref.current?.querySelector<HTMLElement>('button')
      )?.focus(),
    );
    return () => {
      cancelAnimationFrame(timer);
      if (root) root.inert = false;
      opener?.focus();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        tabIndex={-1}
        className="absolute inset-0 bg-n6/35"
        aria-label="Đóng hộp thoại"
        onClick={onClose}
      />
      <dialog
        open
        ref={ref}
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative m-0 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-xl border border-n2 bg-n0 p-6 text-n6 shadow-panel"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeRef.current();
          }
          if (event.key !== 'Tab') return;
          const nodes = ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input:not(:disabled),textarea,select,a[href],[tabindex="0"]',
          );
          if (!nodes?.length) return;
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="mb-6 flex items-start justify-between gap-5">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description && <p className="mt-2 text-sm text-n4">{description}</p>}
          </div>
          <button className="rounded p-1 text-n4 hover:bg-n1" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </dialog>
    </div>,
    document.body,
  );
}
