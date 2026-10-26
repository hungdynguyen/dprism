import type { ReactNode } from 'react';
export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: Readonly<{
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-n5">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-n4" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-sm text-primary" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
