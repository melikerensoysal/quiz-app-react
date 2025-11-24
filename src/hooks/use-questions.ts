import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/query-keys";
import type { Question } from "../types";
import { fetchQuestions as fetchQuestionsFromApi } from "../api/opentdb";

export const useQuestions = (
  categoryId: number | null,
  amount: number,
  difficulty?: string,
  type?: string,
  refreshToken?: number
) => {
  return useQuery<Question[], Error>({
    queryKey: [
      QUERY_KEYS.QUESTIONS,
      categoryId,
      amount,
      difficulty,
      type,
      refreshToken,
    ],
    queryFn: async () => {
      const primary = await fetchQuestionsFromApi(
        categoryId!,
        amount,
        difficulty,
        type
      );

      if (primary.length === 0 && type === "boolean") {
        console.warn(
          "No boolean questions found. Falling back to multiple-choice."
        );

        const fallback = await fetchQuestionsFromApi(
          categoryId!,
          amount,
          difficulty,
          "multiple"
        );

        return fallback;
      }

      return primary;
    },
    enabled: !!categoryId && !!amount,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
