import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api';
import { isRunActive } from '@/utils/runStatus';
import { caseKeys } from '@/hooks/useCases';
export const runKeys = { detail: (id: string) => ['runs', id] as const };
export function useRun(id: string) {
  return useQuery({
    queryKey: runKeys.detail(id),
    queryFn: ({ signal }) => api.getRun(id, signal),
    enabled: !!id,
    refetchInterval: (q) => (isRunActive(q.state.data?.status) ? 700 : false),
    refetchIntervalInBackground: true,
  });
}
export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.startRun,
    onSuccess: (data) => {
      qc.setQueryData(runKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
}
export function useShareRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.shareRun,
    onSuccess: (data) => {
      qc.setQueryData(runKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: ['shared-cases'] });
    },
  });
}
