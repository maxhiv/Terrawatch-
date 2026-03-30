import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if ([401, 403, 404].includes(error?.status)) return false;
        return failureCount < 2;
      },
    },
  },
});
