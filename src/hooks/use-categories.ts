import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../api/opentdb";
import { QUERY_KEYS } from "../constants/query-keys";
import type { Category } from "../types";

export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: fetchCategories,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};