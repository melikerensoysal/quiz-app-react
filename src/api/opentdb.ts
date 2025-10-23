import apiClient from "./apiClient";
import type { Category, Question } from "../types";

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ trivia_categories: Category[] }>(
    "/api_category.php"
  );
  return response.data.trivia_categories;
};

export const fetchQuestions = async (
  categoryId: number
): Promise<Question[]> => {
  const amount = 10;
  const response = await apiClient.get<{ results: Question[] }>(
    `/api.php?amount=${amount}&category=${categoryId}&type=multiple`
  );

  return response.data.results.map((question) => ({
    ...question,
    question: decodeURIComponent(question.question),
    correct_answer: decodeURIComponent(question.correct_answer),
    incorrect_answers: question.incorrect_answers.map((answer: string) =>
      decodeURIComponent(answer)
    ),
  }));
};