import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, errorMessage } from './errors';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Toast title on failure; `false` when the caller shows the error. */
      errorTitle?: string | false;
    };
  }
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          // Client errors won't succeed on retry.
          if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          return failureCount < 2;
        }
      }
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const title = mutation.meta?.errorTitle;
        if (title === false) return;
        toast.error(title ?? errorMessage(error), {
          description: title ? errorMessage(error) : undefined
        });
      }
    })
  });
}
