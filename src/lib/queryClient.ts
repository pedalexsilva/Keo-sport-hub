import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,    // 5 minutes - data considered fresh
            gcTime: 30 * 60 * 1000,      // 30 minutes - cache retention (formerly cacheTime)
            retry: 2,                     // Retry failed queries twice
            refetchOnWindowFocus: false,  // Don't refetch on tab focus (reduces API calls)
        },
    },
});
