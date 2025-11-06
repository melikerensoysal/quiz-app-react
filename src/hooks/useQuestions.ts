import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { Question } from "../types";

const fetchQuestions = async (categoryId: number) => {
  const url = `https://opentdb.com/api.php?amount=10&category=${categoryId}&type=multiple&_t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.results ?? [];
};

export const useQuestions = (categoryId: number | null, refreshToken?: number) => {
  return useQuery<Question[], Error>({
    queryKey: [QUERY_KEYS.QUESTIONS, categoryId, refreshToken],
    queryFn: () => fetchQuestions(categoryId!),
    enabled: !!categoryId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};