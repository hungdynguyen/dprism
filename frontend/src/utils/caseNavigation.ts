import type { CaseDraft } from '@/types';

export function caseDestination(item: CaseDraft) {
  if (item.runId) return `/runs/${item.runId}`;
  if (item.chatId) return `/chats/${item.chatId}`;
  if (!item.method) return `/cases?resume=${encodeURIComponent(item.id)}`;
  if (item.method === 'template')
    return `/cases/${item.id}/${item.templateId ? 'plan' : 'templates'}`;
  if (item.method === 'direct') return `/cases/${item.id}/experts`;
  return `/cases/${item.id}/setup/${item.wizardStep}`;
}
