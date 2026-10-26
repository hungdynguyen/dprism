import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/api';
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: ({ signal }) => getMe(signal),
    retry: false,
  });
}
