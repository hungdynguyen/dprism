import { useCallback, useEffect, useRef, useState } from 'react';
import { useCase, useUpdateCase } from '@/hooks/useCases';
import type { CaseDraft } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { clearRecovery, readCaseRecovery, writeRecovery } from '@/utils/draftStorage';

export function useCaseEditor(id: string) {
  const query = useCase(id),
    mutation = useUpdateCase(id);
  const auth = useAuth(),
    storageKey = `dprism.case-draft:${auth.data?.id || 'user'}:${id}`;
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  // Seed only when switching cases, never overwrite a user's edits with a refetch.
  if (query.data && draft?.id !== query.data.id) setDraft(readCaseRecovery(storageKey, query.data));
  const latest = useRef<CaseDraft | null>(null),
    savedRevision = useRef(-1);
  const mutateAsync = mutation.mutateAsync;
  const save = useCallback(
    async (value?: CaseDraft) => {
      const current = value || latest.current;
      if (!current || current.runId) return current;
      const result = await mutateAsync(current);
      savedRevision.current = Math.max(savedRevision.current, result.revision);
      if ((latest.current?.revision ?? 0) <= result.revision) clearRecovery(storageKey);
      return result;
    },
    [mutateAsync, storageKey],
  );
  useEffect(() => {
    latest.current = draft;
    if (draft && !draft.runId && draft.revision > savedRevision.current)
      writeRecovery(storageKey, draft);
  }, [draft, storageKey]);
  useEffect(() => {
    if (
      query.data &&
      draft?.revision === query.data.revision &&
      !mutation.isPending &&
      !mutation.isError
    )
      savedRevision.current = Math.max(savedRevision.current, query.data.revision);
  }, [query.data, draft?.revision, mutation.isPending, mutation.isError]);
  useEffect(() => {
    if (
      !draft ||
      draft.runId ||
      mutation.isError ||
      draft.revision <= (query.data?.revision ?? -1) ||
      draft.revision <= savedRevision.current
    )
      return;
    const timer = setTimeout(() => {
      void save(draft).catch(() => {
        /* Mutation error remains visible and can be retried. */
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [draft, query.data?.revision, save, mutation.isError]);
  useEffect(
    () => () => {
      const current = latest.current;
      if (current && !current.runId && current.revision > savedRevision.current)
        void save(current).catch(() => {
          /* A failed save is reported by the mutation cache on return. */
        });
    },
    [save],
  );
  const reset = mutation.reset;
  const update = useCallback(
    (change: Partial<CaseDraft> | ((old: CaseDraft) => Partial<CaseDraft>)) => {
      reset();
      setDraft((old) =>
        old
          ? {
              ...old,
              ...(typeof change === 'function' ? change(old) : change),
              revision: old.revision + 1,
            }
          : old,
      );
    },
    [reset],
  );
  return {
    ...query,
    draft,
    update,
    replace: setDraft,
    save,
    saving: mutation.isPending,
    saveError: mutation.error,
  };
}
