// Shared TanStack Query client. All API calls go through query hooks (no raw
// fetch in components, per CLAUDE.md).

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
