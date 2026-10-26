import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoute } from '@/test/renderWithProviders';
import { server } from '@/test/setup';
describe('React user journeys', () => {
  it('does not mount application routes when authentication fails', async () => {
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({ detail: 'Chưa được cấp quyền.' }, { status: 403 }),
      ),
    );
    renderRoute('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa được cấp quyền.');
    expect(screen.queryByRole('heading', { name: /Chào/ })).not.toBeInTheDocument();
  });
  it('names a case before selecting a template and jumps directly to plan review', async () => {
    const user = userEvent.setup();
    renderRoute('/cases');
    await user.click(await screen.findByRole('button', { name: 'Dùng template' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Tên case/), '  Review Alpha  ');
    await user.click(within(dialog).getByRole('button', { name: 'Tiếp tục' }));
    expect(
      await screen.findByRole('heading', { name: 'Chọn template', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Case: Review Alpha/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Trao đổi riêng' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Thẩm định rủi ro hệ thống AI/ }));
    expect(
      await screen.findByRole('heading', { name: 'Review plan & bắt đầu' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên case/)).toHaveValue('Review Alpha');
    expect(screen.queryByRole('heading', { name: 'Mô tả vấn đề' })).not.toBeInTheDocument();
  });
  it('names a new case from the shared expert card and sends through the API adapter', async () => {
    const user = userEvent.setup();
    renderRoute('/experts');
    const chat = await screen.findByRole('button', { name: 'Trao đổi riêng với Security Expert' });
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tạo expert' })).not.toBeInTheDocument();
    await user.click(chat);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Security Expert');
    await user.type(within(dialog).getByLabelText(/Tên case/), 'Security review');
    await user.click(within(dialog).getByRole('button', { name: 'Bắt đầu trao đổi' }));
    await user.type(
      await screen.findByLabelText('Tin nhắn cho expert'),
      'Cần chuẩn bị bằng chứng nào?{Enter}',
    );
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent('Security Expert'));
    expect(screen.getByRole('heading', { name: 'Security review', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('System instructions')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Chọn expert khác' })).not.toBeInTheDocument();
    expect(screen.getByRole('log')).toHaveTextContent('Cần chuẩn bị bằng chứng nào?');
  });
});
