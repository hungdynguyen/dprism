import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, Conversation, Expert } from '@/types';
import { uid } from '@/utils/format';
interface ChatStore {
  conversations: Conversation[];
  start: (options: {
    id?: string;
    expert: Expert;
    title?: string;
    caseId?: string;
    returnTo?: string;
  }) => string;
  addMessage: (id: string, message: ChatMessage) => void;
  markFailed: (id: string, messageId: string, failed: boolean) => void;
}
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      start: ({ id: requestedId, expert, title, caseId, returnTo = '/experts' }) => {
        const existing = get().conversations.find(
          (c) => c.id === requestedId || (!!caseId && c.caseId === caseId),
        );
        if (existing) return existing.id;
        const id = requestedId || uid('chat');
        const item: Conversation = {
          id,
          title: title || `Trao đổi với ${expert.role}`,
          caseId: caseId || null,
          expert: structuredClone(expert),
          returnTo,
          messages: [],
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ conversations: [item, ...state.conversations].slice(0, 50) }));
        return id;
      },
      addMessage: (id, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() }
              : c,
          ),
        })),
      markFailed: (id, messageId, failed) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === messageId ? { ...m, failed } : m)),
                }
              : c,
          ),
        })),
    }),
    {
      name: 'dprism.chat.v1',
      version: 1,
      partialize: (state) => ({ conversations: state.conversations }),
      onRehydrateStorage: () => (state) => {
        // A browser reload cannot resume an HTTP request; make unanswered messages retryable.
        for (const conversation of state?.conversations || []) {
          const last = conversation.messages.at(-1);
          if (last?.role === 'user' && !last.failed)
            state?.markFailed(conversation.id, last.id, true);
        }
      },
    },
  ),
);
