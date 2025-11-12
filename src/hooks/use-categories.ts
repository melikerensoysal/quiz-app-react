import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../api/opentdb";
import { QUERY_KEYS } from "../constants/query-keys";
import type { Category } from "../types";

export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: async () => {
      const cached = localStorage.getItem("categories_cache");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          localStorage.removeItem("categories_cache");
        }
      }

      const data = await fetchCategories();
      localStorage.setItem("categories_cache", JSON.stringify(data));
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
