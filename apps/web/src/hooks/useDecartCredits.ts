import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import type { DecartCreditsResponse } from "@morphix/shared";

export function useDecartCredits(options?: { enabled?: boolean; live?: boolean }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onCredits = (event: Event) => {
      const detail = (event as CustomEvent<DecartCreditsResponse>).detail;
      if (!detail) return;
      queryClient.setQueryData(["decartCredits"], detail);
    };

    window.addEventListener("morphix:decart-credits", onCredits);
    return () => window.removeEventListener("morphix:decart-credits", onCredits);
  }, [queryClient]);

  return useQuery({
    queryKey: ["decartCredits"],
    queryFn: api.getDecartCredits,
    enabled: options?.enabled ?? true,
    staleTime: 5_000,
    refetchInterval: options?.live ? 10_000 : 20_000,
    retry: 1,
  });
}
