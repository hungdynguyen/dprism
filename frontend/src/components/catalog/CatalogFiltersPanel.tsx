import type { SharedCase } from '@/types';
import type { CatalogFilters } from '@/utils/caseCatalog';

function FilterGroup({
  title,
  options,
  selected,
  onChange,
}: Readonly<{
  title: string;
  options: { id: string; label: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
}>) {
  return (
    <fieldset className="mt-4 space-y-2 border-t border-n2">
      <legend className="mb-2 pr-2 text-xs font-semibold">{title}</legend>
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-n4"
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={selected.includes(option.id)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...selected, option.id]
                  : selected.filter((id) => id !== option.id),
              )
            }
          />
          <span className="min-w-0 flex-1">{option.label}</span>
          <span className="tabular-nums text-n4">{option.count}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function CatalogFiltersPanel({
  items,
  filters,
  onChange,
  onReset,
}: Readonly<{
  items: SharedCase[];
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
}>) {
  const domains = [...new Set(items.map((item) => item.domain))].sort();
  const experts = [
    ...new Map(
      items.flatMap((item) => item.run.experts).map((expert) => [expert.id, expert]),
    ).values(),
  ];
  const decisions = [...new Set(items.map((item) => item.decisionType))].sort();
  return (
    <div className="rounded-xl border border-n2 bg-n0 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Bộ lọc</h3>
        <button onClick={onReset} className="text-xs font-medium text-primary">
          Đặt lại
        </button>
      </div>
      <FilterGroup
        title="Lĩnh vực"
        selected={filters.domains}
        onChange={(values) => onChange({ domains: values })}
        options={domains.map((domain) => ({
          id: domain,
          label: domain,
          count: items.filter((item) => item.domain === domain).length,
        }))}
      />
      <FilterGroup
        title="Chuyên gia"
        selected={filters.expertIds}
        onChange={(values) => onChange({ expertIds: values })}
        options={experts.map((expert) => ({
          id: expert.id,
          label: expert.role,
          count: items.filter((item) => item.run.experts.some((e) => e.id === expert.id)).length,
        }))}
      />
      <FilterGroup
        title="Loại quyết định"
        selected={filters.decisionTypes}
        onChange={(values) => onChange({ decisionTypes: values })}
        options={decisions.map((decision) => ({
          id: decision,
          label: decision,
          count: items.filter((item) => item.decisionType === decision).length,
        }))}
      />
      <label className="mt-5 block text-xs font-semibold">
        Thời gian
        <select
          aria-label="Lọc theo thời gian"
          value={filters.time}
          onChange={(event) => onChange({ time: event.target.value as CatalogFilters['time'] })}
          className="mt-2 !text-xs"
        >
          <option value="all">Tất cả thời gian</option>
          <option value="7">7 ngày gần đây</option>
          <option value="30">30 ngày gần đây</option>
          <option value="90">90 ngày gần đây</option>
        </select>
      </label>
    </div>
  );
}
