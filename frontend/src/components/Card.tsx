import type { HTMLAttributes } from 'react';
export function Card({ className = '', ...props }: Readonly<HTMLAttributes<HTMLElement>>) {
  return (
    <section className={`min-w-0 rounded-lg border border-n2 bg-n0 p-5 ${className}`} {...props} />
  );
}
