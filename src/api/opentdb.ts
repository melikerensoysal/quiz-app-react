import apiClient from "./api-client";
import type { Category, Question } from "../types";

const decodeHTMLEntities = (text: string) => {
  if (typeof window !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }
  return text;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ trivia_categories: Category[] }>(
    "/api_category.php"
  );
  return response.data.trivia_categories.map((category) => ({
    ...category,
    name: decodeHTMLEntities(category.name),
  }));
};

export const fetchQuestions = async (
  categoryId: number,
  amount: number,
  difficulty?: string,
  type?: string
): Promise<Question[]> => {
  const params = new URLSearchParams();
  params.append("amount", String(amount));
  params.append("category", String(categoryId));

  if (difficulty) params.append("difficulty", difficulty);
  if (type) params.append("type", type);

  const response = await apiClient.get<{ results: Question[] }>(
    `/api.php?${params.toString()}`
  );

  return response.data.results.map((question) => ({
    ...question,
    category: decodeHTMLEntities(question.category),
    question: decodeHTMLEntities(question.question),
    correct_answer: decodeHTMLEntities(question.correct_answer),
    incorrect_answers: question.incorrect_answers.map(decodeHTMLEntities),
  }));
};
