import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoute } from '@/test/renderWithProviders';
import { server } from '@/test/setup';
import { blankCase } from '@/mocks/database';
import { experts, riskTasks, sampleContext, skills } from '@/mocks/fixtures';
import { createMockRun, simulateRun } from '@/mocks/execution';
import { runKeys } from '@/hooks/useRuns';

function sourceRun() {
  return createMockRun(
    {
      ...blankCase('Pipeline stability'),
      context: sampleContext,
      output: 'Bảng rủi ro.',
      templateId: 'ai-risk',
      tasks: riskTasks(),
    },
    experts,
    skills,
    1000,
  );
}

describe('Pipeline loading and refresh stability', () => {
  it('keeps the navigation shell visible while the initial pipeline request is pending', async () => {
    const source = sourceRun();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('/api/runs/:id', async () => {
        await gate;
        return HttpResponse.json(simulateRun(source, 1200));
      }),
    );
    renderRoute(`/runs/${source.id}`);
    await screen.findByText('Đang tải pipeline…');
    expect(screen.getByRole('link', { name: 'Về trang chủ' })).toBeInTheDocument();
    release();
    await screen.findByRole('heading', { name: 'Plan DAG' });
    expect(screen.queryByText('Đang tải pipeline…')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'Đang chạy')).toBe(
      true,
    );
  });

  it('preserves the mounted DAG, selected task and zoom across updates and temporary API failure', async () => {
    const source = sourceRun();
    let response = simulateRun(source, 1200),
      fail = false;
    server.use(
      http.get('/api/runs/:id', () =>
        fail
          ? HttpResponse.json({ detail: 'Mất kết nối tạm thời.' }, { status: 503 })
          : HttpResponse.json(response),
      ),
    );
    const user = userEvent.setup();
    const { client } = renderRoute(`/runs/${source.id}`);
    await screen.findByRole('heading', { name: 'Plan DAG' });
    const first = screen.getByRole('button', { name: /C1.*Prompt injection/ });
    await user.click(first);
    await user.click(screen.getByRole('button', { name: 'Phóng to DAG' }));
    const transform = first.parentElement?.style.transform;
    const graph = screen.getByRole('region', { name: 'Pipeline' });
    response = simulateRun(source, 4200);
    await act(async () => {
      await client.refetchQueries({ queryKey: runKeys.detail(source.id) });
    });
    await waitFor(() =>
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25'),
    );
    expect(screen.getByRole('region', { name: 'Pipeline' })).toBe(graph);
    expect(screen.getByRole('button', { name: /C1.*Prompt injection/ })).toBe(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(first.parentElement?.style.transform).toBe(transform);
    fail = true;
    await act(async () => {
      await client.refetchQueries({ queryKey: runKeys.detail(source.id) });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Đang giữ dữ liệu gần nhất');
    expect(screen.getByRole('region', { name: 'Pipeline' })).toBe(graph);
    expect(screen.queryByText('Đang tải pipeline…')).not.toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(first.parentElement?.style.transform).toBe(transform);
  });

  it('shows an explicit completion cue before automatically opening the results dashboard', async () => {
    const source = sourceRun();
    let response = simulateRun(source, 11500);
    server.use(http.get('/api/runs/:id', () => HttpResponse.json(response)));
    const { client } = renderRoute(`/runs/${source.id}`);
    await screen.findByRole('heading', { name: 'Plan DAG' });
    response = simulateRun(source, 13000);
    await act(async () => {
      await client.refetchQueries({ queryKey: runKeys.detail(source.id) });
    });
    expect(
      await screen.findByRole('heading', { name: 'Pipeline đã hoàn tất' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Đang mở dashboard kết quả…')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Xem báo cáo' })).toBeInTheDocument(),
      { timeout: 2500 },
    );
  });
});
