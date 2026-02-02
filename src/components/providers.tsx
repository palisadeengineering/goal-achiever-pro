'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

function handleQueryError(error: unknown) {
  const message = error instanceof Error ? error.message : 'An error occurred';

  // Don't show toast for abort errors (user navigated away)
  if (error instanceof Error && error.name === 'AbortError') {
    return;
  }

  toast.error(message, {
    description: 'Please try again or contact support if the problem persists.',
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && error.message.includes('4')) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            onError: handleQueryError,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
