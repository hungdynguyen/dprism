import type { CaseDraft, Conversation } from '@/types';
import { caseDestination } from '@/utils/caseNavigation';
import { isRunActive, RUN_STATUS } from '@/utils/runStatus';

export interface OwnedCaseRow {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  state: string;
  to: string;
  date: string;
  action: string;
  direct: boolean;
}

export function ownedCaseRows(cases: CaseDraft[], chats: Conversation[]): OwnedCaseRow[] {
  const rows = cases.map((item): OwnedCaseRow => {
    const chat = chats.find((c) => c.caseId === item.id || c.id === item.chatId);
    const direct = item.method === 'direct' || !!chat;
    return {
      id: item.id,
      title: item.title,
      subtitle: chat?.expert.role || item.context.task || 'Tiếp tục chuẩn bị case.',
      kind: direct
        ? 'Trao đổi riêng'
        : item.method === 'template'
          ? 'Theo template'
          : item.method === 'open'
            ? 'Theo chủ đề'
            : 'Chưa chọn hình thức',
      state: chat
        ? `${chat.messages.filter((m) => m.role === 'user').length} tin nhắn`
        : item.runStatus
          ? RUN_STATUS[item.runStatus].label
          : item.runId
            ? 'Đã bắt đầu'
            : 'Bản nháp',
      to: chat
        ? `/chats/${chat.id}`
        : item.chatId
          ? `/cases/${item.id}/experts`
          : caseDestination(item),
      date: chat && chat.updatedAt > item.updatedAt ? chat.updatedAt : item.updatedAt,
      action: chat
        ? 'Tiếp tục trao đổi'
        : item.runId
          ? isRunActive(item.runStatus)
            ? 'Xem tiến trình'
            : 'Xem kết quả'
          : item.method === 'template' && !item.templateId
            ? 'Chọn template'
            : 'Tiếp tục',
      direct,
    };
  });
  // Retain conversations created by older versions without showing a linked case twice.
  for (const chat of chats) {
    if (cases.some((item) => item.id === chat.caseId || item.chatId === chat.id)) continue;
    rows.push({
      id: `chat-${chat.id}`,
      title: chat.title,
      subtitle: chat.expert.role,
      kind: 'Trao đổi riêng',
      state: `${chat.messages.filter((m) => m.role === 'user').length} tin nhắn`,
      to: `/chats/${chat.id}`,
      date: chat.updatedAt,
      action: 'Tiếp tục trao đổi',
      direct: true,
    });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}
