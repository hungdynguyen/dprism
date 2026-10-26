import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api';
import type { CaseDraft } from '@/types';
import { isRunActive } from '@/utils/runStatus';
export const caseKeys = { all: ['cases'] as const, detail: (id: string) => ['cases', id] as const };
export function useCases() {
  return useQuery({
    queryKey: caseKeys.all,
    queryFn: ({ signal }) => api.getCases(signal),
    refetchInterval: (q) => (q.state.data?.some((c) => isRunActive(c.runStatus)) ? 3000 : false),
  });
}
export function useCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: ({ signal }) => api.getCase(id, signal),
    enabled: !!id,
  });
}
export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCase,
    onSuccess: (data) => {
      qc.setQueryData(caseKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: caseKeys.all, exact: true });
    },
  });
}
export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    scope: { id: `case-save:${id}` },
    mutationFn: api.updateCase,
    onMutate: (data) => {
      const previous = qc.getQueryData<CaseDraft>(caseKeys.detail(id));
      qc.setQueryData<CaseDraft>(caseKeys.detail(id), (old) =>
        !old || data.revision >= old.revision ? data : old,
      );
      return { previous };
    },
    onError: (_error, data, context) => {
      if (qc.getQueryData<CaseDraft>(caseKeys.detail(id))?.revision === data.revision)
        qc.setQueryData(caseKeys.detail(id), context?.previous);
    },
    onSuccess: (data) => {
      qc.setQueryData<CaseDraft>(caseKeys.detail(id), (old) =>
        !old || data.revision >= old.revision ? data : old,
      );
      void qc.invalidateQueries({ queryKey: caseKeys.all, exact: true });
    },
  });
}
export function useProposePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.proposePlan,
    onSuccess: (data) => {
      qc.setQueryData(caseKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: caseKeys.all, exact: true });
    },
  });
}
export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: ({ signal }) => api.getTemplates(signal) });
}
export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}
export function useSharedCases() {
  return useQuery({
    queryKey: ['shared-cases'],
    queryFn: ({ signal }) => api.getSharedCases(signal),
  });
}
export function useSharedCase(id: string) {
  return useQuery({
    queryKey: ['shared-cases', id],
    queryFn: ({ signal }) => api.getSharedCase(id, signal),
    enabled: !!id,
  });
}
export function useUploadDocument() {
  return useMutation({ mutationFn: api.uploadDocument });
}
export function useSampleCase() {
  return useMutation({ mutationFn: api.getSampleCase });
}
