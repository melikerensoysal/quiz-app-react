import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../api/opentdb";
import { QUERY_KEYS } from "../constants/query-keys";
import { categoryStats } from '../data/category-stats'; 
import type { Category } from "../types";

type CategoryStatsType = typeof categoryStats[keyof typeof categoryStats];

export interface CategoryWithStats extends Category {
  stats: CategoryStatsType;
}

const defaultStats: CategoryStatsType = { total: 0, approved: 0, pending: 0, rejected: 0 };


export const useCategories = () => {
  return useQuery<Category[], Error, CategoryWithStats[]>({
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
    select: (data) => {
      return data.map((category) => ({
        ...category,
        stats: categoryStats[category.id] || defaultStats,
      }));
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};