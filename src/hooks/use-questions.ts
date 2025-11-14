import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/query-keys";
import type { Question } from "../types";
import { fetchQuestions as fetchQuestionsFromApi } from "../api/opentdb";

export const useQuestions = (
  categoryId: number | null,
  refreshToken?: number
) => {
  return useQuery<Question[], Error>({
    queryKey: [QUERY_KEYS.QUESTIONS, categoryId, refreshToken],
    queryFn: () => fetchQuestionsFromApi(categoryId!),
    enabled: !!categoryId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
