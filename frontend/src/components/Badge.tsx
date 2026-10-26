import type { ReactNode } from 'react';
import type { Tone } from '@/types';
const tones: Record<Tone, string> = {
  neutral: 'bg-n1 text-n4',
  primary: 'bg-tint-1 text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
};
export function Badge({
  tone = 'neutral',
  children,
}: Readonly<{ tone?: Tone; children: ReactNode }>) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
