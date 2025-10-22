import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface Question {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface FetchQuestionsParams {
  amount: number;
  category?: number;
}

const fetchQuestions = async ({ amount, category }: FetchQuestionsParams): Promise<Question[]> => {
  const url = new URL("https://opentdb.com/api.php");
  url.searchParams.append("amount", amount.toString());
  if (category) url.searchParams.append("category", category.toString());

  const { data } = await axios.get(url.toString());
  return data.results;
};

export const useQuestions = (amount: number = 10, category?: number) => {
  return useQuery<Question[], Error>({
    queryKey: ["questions", amount, category],
    queryFn: () => fetchQuestions({ amount, category }),
    staleTime: 1000 * 60 * 5,
  });
};
