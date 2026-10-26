import { useQuery } from '@tanstack/react-query';
import * as api from '@/services/api';
export const expertKeys = {
  all: ['experts'] as const,
  detail: (id: string) => ['experts', id] as const,
};
export function useExperts() {
  return useQuery({ queryKey: expertKeys.all, queryFn: ({ signal }) => api.getExperts(signal) });
}
export function useExpert(id: string) {
  return useQuery({
    queryKey: expertKeys.detail(id),
    queryFn: ({ signal }) => api.getExpert(id, signal),
    enabled: !!id,
  });
}
export function useSkills() {
  return useQuery({ queryKey: ['skills'], queryFn: ({ signal }) => api.getSkills(signal) });
}
