import { useQuery } from "@tanstack/react-query";
import { fetchQuestions } from "../api/opentdb";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { Question } from "../types";

export const useQuestions = (categoryId: number | null) => {
  return useQuery<Question[], Error>({
    queryKey: [QUERY_KEYS.QUESTIONS, categoryId],
    queryFn: () => fetchQuestions(categoryId!),
    enabled: !!categoryId,
  });
};