import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds default operational stale time
      gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403 || error?.code === 'PGRST301') {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export const clearAppCache = () => {
  queryClient.clear();
};
