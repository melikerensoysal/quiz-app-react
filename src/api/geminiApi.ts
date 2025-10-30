import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Question } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("Gemini API key not found in environment variables.");
}
const genAI = new GoogleGenerativeAI(API_KEY);

interface AnalysisPayload {
  questions: Question[];
  userAnswers: Record<number, string>;
}

export const getQuizAnalysis = async (payload: AnalysisPayload): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const correctCount = payload.questions.reduce((count, q, index) => {
    return q.correct_answer === payload.userAnswers[index] ? count + 1 : count;
  }, 0);
  const wrongCount = payload.questions.length - correctCount;

  const prompt = `
    Bir quiz uygulamasının sonuçlarını analiz eden bir AI asistanısın. Kullanıcının performansına göre
    cesaret verici, samimi ve bilgilendirici bir analiz metni oluştur.
    
    Kategori: ${payload.questions[0].category}
    Toplam Soru: ${payload.questions.length}
    Doğru Sayısı: ${correctCount}
    Yanlış Sayısı: ${wrongCount}

    Kullanıcının yanlış cevapladığı sorular şunlar:
    ${payload.questions
      .filter((q, index) => q.correct_answer !== payload.userAnswers[index])
      .map((q) => `- Soru: "${q.question}", Doğru Cevap: "${q.correct_answer}"`)
      .join("\n") || "Kullanıcı tüm soruları doğru cevapladı."}

    Lütfen analizini aşağıdaki formatta, Markdown kullanarak ve **Türkçe** olarak yap:
    
    ### Genel Değerlendirme
    (Kullanıcıyı tebrik et ve genel performansını (doğru/yanlış sayısı) özetle.)

    ### Geliştirilebilecek Alanlar
    (Yanlış yapılan sorulara bakarak hangi konularda eksik olabileceğini nazikçe belirt. Örneğin, "Görünüşe göre [konu] ile ilgili sorularda biraz zorlanmışsın." gibi.)

    ### Özet
    (Kullanıcıyı motive edecek pozitif bir kapanış cümlesiyle bitir.)
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};