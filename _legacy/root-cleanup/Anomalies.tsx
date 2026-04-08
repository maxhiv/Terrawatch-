import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useAnomalyStats() {
  return useQuery({ queryKey: ["anomalies","stats"], queryFn: () => api.get("/anomalies/stats"), refetchInterval: 120_000 });
}

export function useAnomalies(params = {}) {
  return useQuery({ queryKey: ["anomalies", params], queryFn: () => api.get("/anomalies?" + new URLSearchParams(params).toString()), refetchInterval: 60_000 });
}

export function useResolveAnomaly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/anomalies/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anomalies"] }),
  });
}
