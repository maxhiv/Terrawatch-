import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useFeedStatus() {
  return useQuery({ queryKey: ["feeds","status"], queryFn: () => api.get("/feeds/status"), refetchInterval: 60_000 });
}

export function useFeeds() {
  return useQuery({ queryKey: ["feeds"], queryFn: () => api.get("/feeds"), staleTime: 300_000 });
}
