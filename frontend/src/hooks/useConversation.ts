import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { replyToExpert } from '@/services/api';
import { useChatStore } from '@/hooks/useChatStore';
import { uid } from '@/utils/format';
export function useConversation(id: string) {
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === id));
  const controller = useRef<AbortController | null>(null);
  const mutation = useMutation({
    mutationFn: async (userMessageId: string) => {
      const current = useChatStore.getState().conversations.find((c) => c.id === id);
      if (!current) throw Error('Không tìm thấy hội thoại.');
      controller.current = new AbortController();
      try {
        return await replyToExpert({
          expertId: current.expert.id,
          caseId: current.caseId,
          messages: current.messages,
          signal: controller.current.signal,
        });
      } catch (error) {
        useChatStore.getState().markFailed(id, userMessageId, true);
        throw error;
      }
    },
    onSuccess: (message) => useChatStore.getState().addMessage(id, message),
  });
  useEffect(() => () => controller.current?.abort(), [id]);
  const send = (text: string) => {
    if (!conversation || mutation.isPending || !text.trim() || conversation.messages.at(-1)?.failed)
      return;
    const message = {
      id: uid('message'),
      role: 'user' as const,
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    useChatStore.getState().addMessage(id, message);
    mutation.mutate(message.id);
  };
  const retry = () => {
    const last = conversation?.messages.at(-1);
    if (last?.failed && !mutation.isPending) {
      useChatStore.getState().markFailed(id, last.id, false);
      mutation.mutate(last.id);
    }
  };
  return { conversation, send, retry, pending: mutation.isPending, error: mutation.error };
}
