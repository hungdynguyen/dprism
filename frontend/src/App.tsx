import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorState, Loading } from '@/components/AsyncState';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const ExpertsPage = lazy(() =>
  import('@/pages/ExpertsPage').then((m) => ({ default: m.ExpertsPage })),
);
const ExpertPage = lazy(() =>
  import('@/pages/ExpertPage').then((m) => ({ default: m.ExpertPage })),
);
const ExpertEditorPage = lazy(() =>
  import('@/pages/ExpertEditorPage').then((m) => ({ default: m.ExpertEditorPage })),
);
const CasesPage = lazy(() => import('@/pages/CasesPage').then((m) => ({ default: m.CasesPage })));
const CaseMethodPage = lazy(() =>
  import('@/pages/CaseMethodPage').then((m) => ({ default: m.CaseMethodPage })),
);
const SetupPage = lazy(() => import('@/pages/SetupPage').then((m) => ({ default: m.SetupPage })));
const PlanPage = lazy(() => import('@/pages/PlanPage').then((m) => ({ default: m.PlanPage })));
const ExpertPickerPage = lazy(() =>
  import('@/pages/ExpertPickerPage').then((m) => ({ default: m.ExpertPickerPage })),
);
const ChatPage = lazy(() => import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const RunPage = lazy(() => import('@/pages/RunPage').then((m) => ({ default: m.RunPage })));
const ResultsPage = lazy(() =>
  import('@/pages/ResultsPage').then((m) => ({ default: m.ResultsPage })),
);
const SharedCasePage = lazy(() =>
  import('@/pages/SharedCasePage').then((m) => ({ default: m.SharedCasePage })),
);
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });
export function AppRoutes() {
  const auth = useAuth();
  if (auth.isPending) return <Loading label="Đang kiểm tra phiên đăng nhập…" />;
  if (auth.error)
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState error={auth.error} retry={() => void auth.refetch()} />
      </div>
    );
  if (!auth.data.capabilities.appEnabled)
    return (
      <div role="alert" className="p-10 text-center">
        Tài khoản chưa được cấp quyền sử dụng DPrism.
      </div>
    );
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="experts" element={<ExpertsPage />} />
          <Route path="experts/new" element={<ExpertEditorPage />} />
          <Route path="experts/select" element={<ExpertPickerPage />} />
          <Route path="experts/:id" element={<ExpertPage />} />
          <Route path="experts/:id/edit" element={<ExpertEditorPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:id/start" element={<CaseMethodPage />} />
          <Route path="cases/:id/setup/:step" element={<SetupPage />} />
          <Route path="cases/:id/plan" element={<PlanPage />} />
          <Route path="cases/:id/experts" element={<ExpertPickerPage />} />
          <Route path="chats/:id" element={<ChatPage />} />
          <Route path="runs/:id" element={<RunPage />} />
          <Route path="runs/:id/results" element={<ResultsPage />} />
          <Route path="shared/:id" element={<SharedCasePage />} />
          <Route
            path="*"
            element={
              <div className="py-20 text-center">
                <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
                <Link className="mt-5 inline-block text-primary underline" to="/">
                  Về trang chủ
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <ConfirmProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ConfirmProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
