import { Navigate, useParams } from 'react-router-dom';
import { useCase } from '@/hooks/useCases';
import { useChatStore } from '@/hooks/useChatStore';
import { Loading, ErrorState } from '@/components/AsyncState';
import { caseDestination } from '@/utils/caseNavigation';

// Preserve old bookmarks without bringing back the separate method-selection screen.
export function CaseStartRedirect() {
  const { id = '' } = useParams();
  const query = useCase(id);
  const hasChat = useChatStore((state) =>
    state.conversations.some((c) => c.id === query.data?.chatId),
  );
  if (query.isPending) return <Loading />;
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const destination =
    query.data.chatId && !hasChat && !query.data.runId
      ? `/cases/${id}/experts`
      : caseDestination(query.data);
  return <Navigate to={destination} replace />;
}
