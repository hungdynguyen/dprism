export function Tabs({
  items,
  value,
  onChange,
  label,
}: Readonly<{
  items: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-wrap gap-1 border-b border-n2"
      onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const index = items.findIndex((i) => i.value === value),
          delta = event.key === 'ArrowRight' ? 1 : -1;
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : (index + delta + items.length) % items.length;
        onChange(items[next].value);
        (event.currentTarget.children[next] as HTMLElement).focus();
      }}
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          tabIndex={value === item.value ? 0 : -1}
          onClick={() => onChange(item.value)}
          className={`flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm ${value === item.value ? 'border-primary font-semibold text-primary' : 'border-transparent text-n4 hover:text-n6'}`}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="rounded bg-n1 px-1.5 text-xs text-n4">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
