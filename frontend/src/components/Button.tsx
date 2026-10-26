import type { ButtonHTMLAttributes } from 'react';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
const styles: Record<Variant, string> = {
  primary: 'border-primary bg-primary text-n0 hover:border-primary-deep hover:bg-primary-deep',
  secondary: 'border-n2 bg-n0 text-n5 hover:bg-n1',
  ghost: 'border-transparent bg-transparent text-n4 hover:bg-n1',
  danger: 'border-tint-2 bg-tint-1 text-primary hover:bg-tint-2',
  soft: 'border-transparent bg-tint-1 text-primary hover:bg-tint-2',
};
export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
