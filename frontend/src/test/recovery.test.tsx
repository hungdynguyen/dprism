import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoute } from '@/test/renderWithProviders';
import { server } from '@/test/setup';
import * as api from '@/services/api';
import { sampleContext } from '@/mocks/fixtures';
import { useChatStore } from '@/hooks/useChatStore';

describe('Recoverable editing and messaging', () => {
  it('keeps an expert form draft across navigation and clears it on explicit cancel', async () => {
    const user = userEvent.setup(),
      first = renderRoute('/experts/safety/edit');
    const field = await screen.findByLabelText(/Vai trò chuyên môn/);
    await user.clear(field);
    await user.type(field, 'Senior Safety Expert');
    await user.click(screen.getByRole('link', { name: 'Về trang chủ' }));
    await screen.findByRole('heading', { name: 'Chào Tran!' });
    first.unmount();
    first.client.clear();
    renderRoute('/experts/safety/edit');
    expect(await screen.findByLabelText(/Vai trò chuyên môn/)).toHaveValue('Senior Safety Expert');
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    await screen.findByRole('heading', { name: 'AI Safety Expert', level: 1 });
    expect(sessionStorage.getItem('dprism.expert-draft:tran:safety')).toBeNull();
    expect((await api.getExpert('safety')).role).toBe('AI Safety Expert');
  });
  it('keeps a failed case edit recoverable and allows an explicit retry', async () => {
    const draft = await api.createCase({ title: 'Retry test' }),
      template = (await api.getTemplates())[0];
    await api.updateCase({
      ...draft,
      method: 'template',
      templateId: template.id,
      context: sampleContext,
      output: template.output,
      tasks: template.tasks,
      documents: template.documents,
      revision: 1,
    });
    server.use(
      http.put('/api/cases/:id', () =>
        HttpResponse.json({ detail: 'Không thể lưu lúc này.' }, { status: 503 }),
      ),
    );
    const user = userEvent.setup();
    renderRoute(`/cases/${draft.id}/plan`);
    const field = await screen.findByLabelText('Tên task');
    await user.clear(field);
    await user.type(field, 'Edited task');
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu lúc này.');
    expect(field).toHaveValue('Edited task');
    expect(sessionStorage.getItem(`dprism.case-draft:tran:${draft.id}`)).toContain('Edited task');
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await waitFor(async () =>
      expect((await api.getCase(draft.id)).tasks[0].title).toBe('Edited task'),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  }, 10000);
  it('makes an unanswered persisted message retryable after rehydration', async () => {
    const expert = await api.getExpert('safety'),
      store = useChatStore.getState();
    const id = store.start({ expert });
    store.addMessage(id, {
      id: 'unsent',
      role: 'user',
      content: 'Question',
      createdAt: new Date().toISOString(),
    });
    await useChatStore.persist.rehydrate();
    expect(
      useChatStore
        .getState()
        .conversations.find((c) => c.id === id)
        ?.messages.at(-1)?.failed,
    ).toBe(true);
  });
});
