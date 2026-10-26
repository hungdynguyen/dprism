import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoute } from '@/test/renderWithProviders';
import { server } from '@/test/setup';
import * as api from '@/services/api';
import { useChatStore } from '@/hooks/useChatStore';

describe('Workspace case entry', () => {
  it('exposes the three entry points directly from welcome and does not create a case on cancel', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    await user.click(await screen.findByRole('link', { name: 'Khám phá & tạo case' }));
    const entry = await screen.findByRole('region', { name: 'Bắt đầu công việc' });
    expect(within(entry).getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('textbox', { name: 'Tìm template' })).not.toBeInTheDocument();
    await user.click(within(entry).getByRole('button', { name: 'Dùng template' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Hủy' }),
    );
    expect(await api.getCases()).toHaveLength(0);
    await user.click(within(entry).getByRole('button', { name: 'Thảo luận theo chủ đề' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Tên case/), 'Open issue');
    await user.click(within(dialog).getByRole('button', { name: 'Tiếp tục' }));
    await screen.findByRole('heading', { name: 'Mô tả vấn đề' });
    expect(screen.getByLabelText(/Tên case/)).toHaveValue('Open issue');
    const [saved] = await api.getCases();
    expect(saved).toMatchObject({ title: 'Open issue', method: 'open', wizardStep: 1 });
  });

  it('chooses an expert before naming a direct case and preserves shared context through the profile', async () => {
    const shared = (await api.getSharedCases())[0];
    const user = userEvent.setup();
    renderRoute(`/shared/${shared.id}`);
    await user.click(await screen.findByRole('link', { name: 'Dùng làm context' }));
    await user.click(await screen.findByRole('button', { name: 'Trao đổi riêng' }));
    await screen.findByRole('heading', { name: 'Bạn muốn trao đổi với ai?' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await api.getCases()).toHaveLength(0);
    await user.click(screen.getByRole('link', { name: 'AI Safety Expert' }));
    await user.click(await screen.findByRole('button', { name: 'Trao đổi riêng' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Tên case/), 'Follow-up question');
    await user.click(within(dialog).getByRole('button', { name: 'Bắt đầu trao đổi' }));
    await screen.findByLabelText('Tin nhắn cho expert');
    const [saved] = await api.getCases();
    expect(saved).toMatchObject({ method: 'direct', referenceCaseIds: [shared.id] });
    expect(useChatStore.getState().conversations[0].caseId).toBe(saved.id);
  });

  it('resumes a named template draft at the template picker after leaving it', async () => {
    const draft = await api.createCase({ title: 'Choose later', method: 'template' });
    const user = userEvent.setup();
    renderRoute('/cases');
    expect(await screen.findByRole('link', { name: 'Choose later' })).toHaveAttribute(
      'href',
      `/cases/${draft.id}/templates`,
    );
    await user.click(screen.getByRole('link', { name: 'Choose later' }));
    await screen.findByRole('heading', { name: 'Chọn template' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Quay lại Cases' }));
    expect(await api.getCases()).toHaveLength(1);
  });

  it('reuses legacy drafts from old start URLs without asking for another name', async () => {
    const draft = await api.createCase({ title: 'Legacy draft' });
    const user = userEvent.setup();
    renderRoute(`/cases/${draft.id}/start`);
    await screen.findByText('Legacy draft', { selector: 'strong' });
    await user.click(screen.getByRole('button', { name: 'Dùng template' }));
    await screen.findByRole('heading', { name: 'Chọn template' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect((await api.getCase(draft.id)).method).toBe('template');
    expect(await api.getCases()).toHaveLength(1);
  });

  it('keeps template search and pagination on their own screen and retries failed selection', async () => {
    const draft = await api.createCase({ title: 'Template retry', method: 'template' });
    const user = userEvent.setup();
    renderRoute(`/cases/${draft.id}/templates`);
    await screen.findByRole('heading', { name: 'Chọn template' });
    const library = screen.getByRole('region', { name: 'Thư viện template' });
    await user.click(within(library).getByRole('button', { name: 'Trang tiếp' }));
    expect(within(library).getByRole('status')).toHaveTextContent('7–8 trong 8 template');
    await user.type(screen.getByLabelText('Tìm template'), 'khongtontai');
    expect(
      within(library).getByRole('heading', { name: 'Chưa có template phù hợp' }),
    ).toBeInTheDocument();
    await user.click(within(library).getByRole('button', { name: 'Xóa bộ lọc' }));
    server.use(
      http.put('/api/cases/:id', () =>
        HttpResponse.json({ detail: 'Lưu chưa được.' }, { status: 503 }),
      ),
    );
    await user.click(within(library).getByRole('button', { name: /Thẩm định rủi ro hệ thống AI/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Lưu chưa được.');
    expect((await api.getCase(draft.id)).templateId).toBeNull();
    server.resetHandlers();
    await user.click(within(library).getByRole('button', { name: /Thẩm định rủi ro hệ thống AI/ }));
    await screen.findByRole('heading', { name: 'Review plan & bắt đầu' });
    expect((await api.getCase(draft.id)).tasks.length).toBeGreaterThan(0);
  });

  it('retains edited tasks when returning to the same template and confirms replacing another', async () => {
    const draft = await api.createCase({ title: 'Keep edits', method: 'template' });
    const templates = await api.getTemplates();
    await api.updateCase({
      ...draft,
      templateId: templates[0].id,
      tasks: templates[0].tasks.map((task, index) =>
        index ? task : { ...task, title: 'My edited task' },
      ),
      output: templates[0].output,
      revision: 1,
    });
    const user = userEvent.setup();
    renderRoute(`/cases/${draft.id}/plan`);
    await screen.findByRole('heading', { name: 'Review plan & bắt đầu' });
    await user.click(screen.getByRole('button', { name: /Chọn template khác/ }));
    await user.click(await screen.findByRole('button', { name: new RegExp(templates[0].title) }));
    expect(await screen.findByLabelText('Tên task')).toHaveValue('My edited task');
    await user.click(screen.getByRole('button', { name: /Chọn template khác/ }));
    await user.click(await screen.findByRole('button', { name: new RegExp(templates[1].title) }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Hủy' }));
    await waitFor(async () =>
      expect((await api.getCase(draft.id)).tasks[0].title).toBe('My edited task'),
    );
  });
});
