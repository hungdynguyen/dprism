import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/renderWithProviders';
import * as api from '@/services/api';
import { db } from '@/mocks/database';
import { useChatStore } from '@/hooks/useChatStore';
import { ownedCaseRows } from '@/utils/ownedCases';

describe('Owned, received and public case collections', () => {
  it('shows direct conversations and discussions in the same owned list without duplicates', async () => {
    const draft = await api.createCase({ title: 'Private security question', method: 'direct' });
    const expert = await api.getExpert('security');
    const chatId = useChatStore.getState().start({ expert, title: draft.title, caseId: draft.id });
    await api.updateCase({ ...draft, chatId, revision: 1 });
    await api.createCase({ title: 'Risk review', method: 'open' });
    const user = userEvent.setup();
    renderRoute('/cases');
    const owned = await screen.findByRole('region', { name: 'Case của tôi' });
    expect(within(owned).getAllByRole('article')).toHaveLength(2);
    expect(within(owned).getByRole('link', { name: draft.title })).toHaveAttribute(
      'href',
      `/chats/${chatId}`,
    );
    const tabs = within(screen.getByRole('tablist', { name: 'Loại lịch sử' })).getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Case của tôi2',
      'Case được share với tôi2',
      'Library6',
    ]);
    expect(screen.queryByRole('tab', { name: /^Trao đổi riêng/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^Đã chia sẻ/ })).not.toBeInTheDocument();
    await user.type(within(owned).getByLabelText('Tìm trong lịch sử'), 'security');
    expect(within(owned).getAllByRole('article')).toHaveLength(1);
    await user.click(within(owned).getByRole('link', { name: draft.title }));
    await screen.findByRole('heading', { name: draft.title, level: 1 });
  });

  it('separates public cases from direct grants and rejects inaccessible case details', async () => {
    const publicCases = await api.getSharedCases(undefined, 'public');
    const received = await api.getSharedCases(undefined, 'received');
    expect(publicCases).toHaveLength(6);
    expect(received).toHaveLength(2);
    expect(publicCases.every((item) => item.visibility === 'public')).toBe(true);
    expect(
      received.every(
        (item) => item.visibility === 'restricted' && item.recipientIds.includes('tran'),
      ),
    ).toBe(true);
    expect(publicCases.some((item) => received.some((r) => r.id === item.id))).toBe(false);
    db.shared.push({ ...received[0], id: 'not-shared-with-tran', recipientIds: ['another-user'] });
    expect((await api.getSharedCases()).some((item) => item.id === 'not-shared-with-tran')).toBe(
      false,
    );
    await expect(api.getSharedCase('not-shared-with-tran')).rejects.toMatchObject({ status: 404 });
  });

  it('supports library filters, grid/list and an inspectable case with reusable context', async () => {
    const user = userEvent.setup();
    renderRoute('/cases?tab=library');
    const library = await screen.findByRole('region', { name: 'Library' });
    expect(within(library).getAllByRole('button', { name: /^Xem chi tiết / })).toHaveLength(6);
    expect(
      within(library).queryByText('AutoSupport · Rà soát quyền riêng tư nội bộ'),
    ).not.toBeInTheDocument();
    await user.click(within(library).getByRole('checkbox', { name: /^Bảo mật/ }));
    expect(within(library).getAllByRole('button', { name: /^Xem chi tiết / })).toHaveLength(2);
    await user.click(within(library).getByRole('button', { name: 'Dạng danh sách' }));
    expect(within(library).getByRole('button', { name: 'Dạng danh sách' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(library).getAllByRole('button', { name: /^Xem chi tiết / })[0]);
    const detail = within(library).getByRole('region', { name: 'Chi tiết case' });
    await user.click(within(detail).getByRole('tab', { name: 'Tài liệu' }));
    expect(within(detail).getByRole('button', { name: /SEC-04/ })).toBeInTheDocument();
    const context = within(detail).getByRole('link', { name: 'Dùng làm context cho case mới' });
    await user.click(context);
    await screen.findByRole('region', { name: 'Bắt đầu công việc' });
    expect(screen.getByText(/Case mới sẽ dùng 1 case chia sẻ làm context/)).toBeInTheDocument();
  });

  it('opens received cases with their correct return destination', async () => {
    const user = userEvent.setup();
    renderRoute('/cases?tab=received');
    const received = await screen.findByRole('region', { name: 'Case được chia sẻ với tôi' });
    expect(within(received).getAllByRole('button', { name: /^Xem chi tiết / })).toHaveLength(2);
    expect(
      within(received).queryByText('AutoSupport · Đánh giá trước pilot'),
    ).not.toBeInTheDocument();
    await user.click(within(received).getByRole('link', { name: 'Xem toàn bộ case' }));
    expect(
      await screen.findByRole('link', { name: 'Quay lại case được chia sẻ với tôi' }),
    ).toHaveAttribute('href', '/cases?tab=received');
    expect(screen.getByText(/CHIA SẺ TRỰC TIẾP VỚI BẠN/)).toBeInTheDocument();
  });

  it('filters by time and shows a recoverable empty result', async () => {
    const user = userEvent.setup();
    renderRoute('/cases?tab=library');
    const library = await screen.findByRole('region', { name: 'Library' });
    await user.selectOptions(within(library).getByLabelText('Lọc theo thời gian'), '7');
    expect(within(library).getAllByRole('button', { name: /^Xem chi tiết / })).toHaveLength(2);
    await user.type(within(library).getByLabelText('Tìm case trong bộ sưu tập'), 'khongtontai');
    expect(
      within(library).getByRole('heading', { name: 'Không tìm thấy case phù hợp' }),
    ).toBeInTheDocument();
    await user.click(within(library).getByRole('button', { name: 'Đặt lại tìm kiếm và bộ lọc' }));
    expect(within(library).getAllByRole('button', { name: /^Xem chi tiết / })).toHaveLength(6);
  });

  it('keeps legacy chats, deduplicates linked cases and sorts by latest message', async () => {
    const first = await api.createCase({ title: 'Older case', method: 'direct' });
    const second = await api.createCase({ title: 'Newer case', method: 'open' });
    const expert = await api.getExpert('safety');
    useChatStore.getState().start({ expert, caseId: first.id, title: first.title });
    useChatStore.getState().start({ expert, title: 'Legacy conversation' });
    const chats = useChatStore
      .getState()
      .conversations.map((c) => ({ ...c, updatedAt: '2099-01-01T00:00:00.000Z' }));
    const rows = ownedCaseRows([first, second], chats);
    expect(rows).toHaveLength(3);
    expect(rows.filter((row) => row.title === first.title)).toHaveLength(1);
    expect(rows.at(-1)?.id).toBe(second.id);
  });
});
