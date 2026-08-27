import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ListingDetailDTO } from "@/types/api";

export function useListingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => apiClient.get<ListingDetailDTO>(`/api/v1/listings/${id}`),
    enabled: Boolean(id),
  });
}
