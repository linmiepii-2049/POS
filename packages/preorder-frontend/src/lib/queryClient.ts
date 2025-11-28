import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 共用客戶端
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});



