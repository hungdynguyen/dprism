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
    await user.click(await screen.findByRole('button', { name: 'Tạo case' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Tên case/), '  Review Alpha  ');
    await user.click(within(dialog).getByRole('button', { name: 'Tiếp tục' }));
    expect(
      await screen.findByRole('heading', { name: 'Review Alpha', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trực tiếp trao đổi/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Thẩm định rủi ro hệ thống AI/ }));
    expect(
      await screen.findByRole('heading', { name: 'Review plan & bắt đầu' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên case/)).toHaveValue('Review Alpha');
    expect(screen.queryByRole('heading', { name: 'Mô tả vấn đề' })).not.toBeInTheDocument();
  });
  it('allows exactly one expert and sends a message through the API adapter', async () => {
    const user = userEvent.setup();
    renderRoute('/experts/select');
    const safety = await screen.findByRole('radio', { name: 'AI Safety Expert' });
    await user.click(safety);
    await user.click(screen.getByRole('radio', { name: 'Security Expert' }));
    expect(
      screen.getAllByRole('radio').filter((r) => (r as HTMLInputElement).checked),
    ).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /Bắt đầu trao đổi/ }));
    await user.type(
      await screen.findByLabelText('Tin nhắn cho expert'),
      'Cần chuẩn bị bằng chứng nào?',
    );
    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));
    await waitFor(() =>
      expect(screen.getByRole('log')).toHaveTextContent('Phản hồi mô phỏng · Security Expert'),
    );
    expect(screen.getByRole('log')).toHaveTextContent('Cần chuẩn bị bằng chứng nào?');
  });
});
