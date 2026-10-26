import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';

async function boot() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
void boot().catch(() => {
  const root = document.getElementById('root');
  if (root)
    root.textContent =
      'Không thể khởi động ứng dụng. Vui lòng tải lại trang hoặc kiểm tra kết nối API.';
});
