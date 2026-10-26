import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoute } from '@/test/renderWithProviders';
import { server } from '@/test/setup';
import * as api from '@/services/api';
import { useChatStore } from '@/hooks/useChatStore';

describe('Direct chat entry points', () => {
  it('starts from a named case with one card action, preserving context through the profile', async () => {
    const draft = await api.createCase({ title: 'Existing case' });
    const user = userEvent.setup();
    renderRoute(`/cases/${draft.id}/experts`);
    await screen.findByRole('heading', { name: 'Bạn muốn trao đổi với ai?' });
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bắt đầu trao đổi' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'AI Safety Expert' }));
    await screen.findByRole('heading', { name: 'AI Safety Expert', level: 1 });
    expect(screen.queryByRole('link', { name: 'Chỉnh sửa' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Quay lại chọn chuyên gia' }));
    await user.click(
      await screen.findByRole('button', { name: 'Trao đổi riêng với AI Safety Expert' }),
    );
    await screen.findByLabelText('Tin nhắn cho expert');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Existing case', level: 1 })).toBeInTheDocument();
    expect(await api.getCases()).toHaveLength(1);
    const saved = await api.getCase(draft.id);
    expect(saved.method).toBe('direct');
    expect(useChatStore.getState().conversations).toMatchObject([
      { id: saved.chatId, caseId: draft.id, expert: { id: 'safety' } },
    ]);
    const input = screen.getByLabelText('Tin nhắn cho expert');
    await user.type(input, 'First line{Shift>}{Enter}{/Shift}Second line');
    expect(input).toHaveValue('First line\nSecond line');
    expect(screen.getByRole('log')).not.toHaveTextContent('First line');
  });

  it('opens a fresh named case for the same expert without resuming the old conversation', async () => {
    const user = userEvent.setup();
    renderRoute('/experts');
    for (const title of ['First issue', 'Second issue']) {
      await user.click(
        await screen.findByRole('button', { name: 'Trao đổi riêng với AI Safety Expert' }),
      );
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByLabelText(/Tên case/), title);
      await user.click(within(dialog).getByRole('button', { name: 'Bắt đầu trao đổi' }));
      await screen.findByRole('heading', { name: title, level: 1 });
      expect(screen.getByRole('log')).toHaveTextContent('Bạn muốn trao đổi điều gì?');
      if (title === 'First issue') {
        await user.click(screen.getByRole('link', { name: 'Về trang chủ' }));
        await user.click(await screen.findByRole('link', { name: 'Khám phá chuyên gia' }));
      }
    }
    const conversations = useChatStore.getState().conversations;
    expect(conversations).toHaveLength(2);
    expect(new Set(conversations.map((c) => c.caseId)).size).toBe(2);
    expect(await api.getCases()).toHaveLength(2);
    await user.click(screen.getByRole('link', { name: 'Quay lại Cases' }));
    await user.click(await screen.findByRole('link', { name: 'First issue' }));
    await screen.findByRole('heading', { name: 'First issue', level: 1 });
    expect(useChatStore.getState().conversations).toHaveLength(2);
  });

  it('retries a failed case attachment without creating duplicate cases or local chats', async () => {
    server.use(
      http.put('/api/cases/:id', () =>
        HttpResponse.json({ detail: 'Lưu thất bại.' }, { status: 503 }),
      ),
    );
    const user = userEvent.setup();
    renderRoute('/experts');
    await user.click(
      await screen.findByRole('button', { name: 'Trao đổi riêng với AI Safety Expert' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Tên case/), 'Retry chat');
    await user.click(within(dialog).getByRole('button', { name: 'Bắt đầu trao đổi' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Lưu thất bại.');
    expect(useChatStore.getState().conversations).toHaveLength(0);
    expect(await api.getCases()).toHaveLength(1);
    server.resetHandlers();
    await user.click(within(dialog).getByRole('button', { name: 'Bắt đầu trao đổi' }));
    await screen.findByLabelText('Tin nhắn cho expert');
    expect(await api.getCases()).toHaveLength(1);
    expect(useChatStore.getState().conversations).toHaveLength(1);
  });

  it('removes expert editing from the application, including old entry URLs', async () => {
    renderRoute('/experts/safety/edit');
    await screen.findByRole('heading', { name: 'Chuyên gia AI', level: 1 });
    expect(screen.queryByRole('link', { name: 'Tạo expert' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Vai trò chuyên môn/ })).not.toBeInTheDocument();
  });

  it('keeps a failed send retryable inside the simplified chat', async () => {
    const expert = await api.getExpert('safety');
    const chatId = useChatStore.getState().start({ expert, title: 'Retry message' });
    server.use(
      http.post('/api/experts/:id/messages', () =>
        HttpResponse.json({ detail: 'Model chưa sẵn sàng.' }, { status: 503 }),
      ),
    );
    const user = userEvent.setup();
    renderRoute(`/chats/${chatId}`);
    await user.type(await screen.findByLabelText('Tin nhắn cho expert'), 'Question{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Model chưa sẵn sàng.');
    expect(screen.getByRole('button', { name: 'Gửi tin nhắn' })).toBeDisabled();
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent('Phản hồi mô phỏng'));
    expect(useChatStore.getState().conversations[0].messages).toHaveLength(2);
  });
});
