import apiClient from "./api-client";
import type { Category, Question } from "../types";

interface OpenTdbResponse {
  response_code: number;
  results: Question[];
}

interface TokenResponse {
  response_code: number;
  response_message: string;
  token: string;
}

let sessionToken: string | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHTMLEntities = (text: string) => {
  if (typeof window !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }
  return text;
};


const getSessionToken = async (): Promise<string | null> => {
  try {
    const response = await apiClient.get<TokenResponse>("/api_token.php?command=request");
    if (response.data.response_code === 0) {
      return response.data.token;
    }
    return null;
  } catch (error) {
    console.error("Token alınamadı:", error);
    return null;
  }
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ trivia_categories: Category[] }>(
    "/api_category.php"
  );

  return response.data.trivia_categories.map((category: Category) => ({
    ...category,
    name: decodeHTMLEntities(category.name),
  }));
};

export const fetchQuestions = async (
  categoryId: number,
  amount: number,
  difficulty?: string,
  type?: string,
  retryCount = 0 
): Promise<Question[]> => {
  const params = new URLSearchParams();
  params.append("amount", String(amount));
  params.append("category", String(categoryId));

  if (difficulty) params.append("difficulty", difficulty);
  if (type) params.append("type", type);

  if (!sessionToken) {
    sessionToken = await getSessionToken();
  }
  if (sessionToken) {
    params.append("token", sessionToken);
  }

  try {
    const response = await apiClient.get<OpenTdbResponse>(
      `/api.php?${params.toString()}`
    );

    const { response_code, results } = response.data;

    if (response_code === 0) {
      return results.map((question: Question) => ({
        ...question,
        category: decodeHTMLEntities(question.category),
        question: decodeHTMLEntities(question.question),
        correct_answer: decodeHTMLEntities(question.correct_answer),
        incorrect_answers: question.incorrect_answers.map((ans: string) =>
          decodeHTMLEntities(ans)
        ),
      }));
    }

    if (response_code === 1) {
      throw new Error("Seçilen kriterlere uygun yeterli soru bulunamadı. Lütfen ayarları değiştirin.");
    }

    if (response_code === 2) {
      throw new Error("Geçersiz parametre hatası. Lütfen geliştirici ile iletişime geçin.");
    }

    if (response_code === 3 || response_code === 4) {
      if (retryCount >= 2) throw new Error("Oturum yenilenemedi.");
      
      console.log("Token geçersiz veya sorular bitti. Yeni token alınıyor...");
      sessionToken = await getSessionToken();
      return fetchQuestions(categoryId, amount, difficulty, type, retryCount + 1);
    }

    if (response_code === 5) {
      if (retryCount >= 3) throw new Error("Sunucu çok yoğun, lütfen daha sonra tekrar deneyin.");
      
      console.warn("Rate limit! 5 saniye bekleniyor...");
      await wait(5000);
      return fetchQuestions(categoryId, amount, difficulty, type, retryCount + 1); // Tekrar dene
    }

    throw new Error(`Beklenmedik API hatası: Code ${response_code}`);

  } catch (error: any) {
    if (error.message) throw error;
    throw new Error("Sorular yüklenirken bir ağ hatası oluştu.");
  }
};