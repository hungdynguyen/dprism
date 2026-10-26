import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCase } from '@/services/api';
import { caseKeys } from '@/hooks/useCases';
import { useChatStore } from '@/hooks/useChatStore';
import { uid } from '@/utils/format';
import type { CaseDraft, Expert } from '@/types';

export function useStartExpertChat() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ draft, expert }: { draft: CaseDraft; expert: Expert }) => {
      const existing = useChatStore.getState().conversations.find((c) => c.caseId === draft.id);
      if (existing) return { draft, chatId: existing.id };
      const chatId = draft.chatId || uid('chat');
      const saved = await updateCase({
        ...draft,
        method: 'direct',
        chatId,
        revision: draft.revision + 1,
      });
      // Publish the local conversation only after its case has been saved successfully.
      useChatStore.getState().start({
        id: chatId,
        expert,
        title: saved.title,
        caseId: saved.id,
        returnTo: '/cases',
      });
      return { draft: saved, chatId };
    },
    onSuccess: ({ draft }) => {
      client.setQueryData(caseKeys.detail(draft.id), draft);
      void client.invalidateQueries({ queryKey: caseKeys.all, exact: true });
    },
  });
}
