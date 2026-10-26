import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
export function BackLink({ to, children }: Readonly<{ to: string; children: ReactNode }>) {
  return (
    <Link
      to={to}
      className="mb-6 inline-flex min-h-8 items-center gap-2 text-sm font-medium text-n4 hover:text-primary"
    >
      <ArrowLeft size={16} />
      {children}
    </Link>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: Readonly<{ eyebrow?: string; title: string; description?: string; action?: ReactNode }>) {
  return (
    <header className="mb-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {eyebrow && <p className="mb-2 text-xs font-medium text-n4">{eyebrow}</p>}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>
        {action}
      </div>
      {description && <p className="mt-3 text-sm leading-7 text-n4">{description}</p>}
    </header>
  );
}
