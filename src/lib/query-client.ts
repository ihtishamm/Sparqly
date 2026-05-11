import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Don't show error for specific queries if needed
      if (query.meta?.errorMessage === false) return;

      const message = error.message || 'An unexpected error occurred';
      toast.error(message, {
        description:
          (query.meta?.errorMessage as string) || 'Failed to fetch data'
      });
    }
  }),
  mutationCache: new MutationCache({
    onError: (error: any, _variables, _context, mutation) => {
      if (mutation.meta?.errorMessage === false) return;

      const message = error.message || 'Action failed';
      toast.error(message, {
        description:
          (mutation.meta?.errorMessage as string) || 'Please try again later'
      });
    }
  })
});
