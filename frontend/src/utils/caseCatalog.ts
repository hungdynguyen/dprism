import type { SharedCase } from '@/types';
import { matchesSearch } from '@/utils/format';

export interface CatalogFilters {
  search: string;
  domains: string[];
  expertIds: string[];
  decisionTypes: string[];
  time: 'all' | '7' | '30' | '90';
  sort: 'recent' | 'oldest' | 'title';
}
export const emptyCatalogFilters: CatalogFilters = {
  search: '',
  domains: [],
  expertIds: [],
  decisionTypes: [],
  time: 'all',
  sort: 'recent',
};
export function filterCatalog(items: SharedCase[], filters: CatalogFilters, now = Date.now()) {
  return items
    .filter(
      (item) =>
        matchesSearch(
          [
            item.title,
            item.summary,
            item.owner,
            item.domain,
            ...item.tags,
            ...item.run.experts.map((e) => e.role),
          ].join(' '),
          filters.search,
        ) &&
        (!filters.domains.length || filters.domains.includes(item.domain)) &&
        (!filters.expertIds.length ||
          item.run.experts.some((e) => filters.expertIds.includes(e.id))) &&
        (!filters.decisionTypes.length || filters.decisionTypes.includes(item.decisionType)) &&
        (filters.time === 'all' ||
          Date.parse(item.publishedAt) >= now - Number(filters.time) * 86400000),
    )
    .sort((a, b) =>
      filters.sort === 'title'
        ? a.title.localeCompare(b.title, 'vi')
        : filters.sort === 'oldest'
          ? a.publishedAt.localeCompare(b.publishedAt)
          : b.publishedAt.localeCompare(a.publishedAt),
    );
}
