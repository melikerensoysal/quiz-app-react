import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Question } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) throw new Error("Gemini API key not found");

const genAI = new GoogleGenerativeAI(API_KEY);

interface AnalysisPayload {
  questions: Question[];
  userAnswers: Record<number, string>;
  categoryId: number;
  testId: string;
  amount: number;
  difficulty: string;
  type: string;
  changeCounts: Record<number, number>;
}

export const getQuizAnalysis = async (
  payload: AnalysisPayload
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const correctCount = payload.questions.reduce((count, q, i) => {
    const userAnswer = payload.userAnswers[i];
    if (userAnswer === undefined || userAnswer === null) {
      return count;
    }
    return q.correct_answer === userAnswer ? count + 1 : count;
  }, 0);

  const answeredQuestions = Object.keys(payload.userAnswers).length;
  const wrongCount = answeredQuestions - correctCount;
  const unansweredCount = payload.questions.length - answeredQuestions;

  const attemptsArray = payload.questions.map((_, index) => {
    return payload.changeCounts[index] ?? 0;
  });

  const totalAttempts = attemptsArray.reduce((sum, n) => sum + n, 0);
  const maxAttempts = attemptsArray.reduce((max, n) => (n > max ? n : max), 0);
  const avgAttempts =
    attemptsArray.length > 0 ? totalAttempts / attemptsArray.length : 0;

  const incorrectDetails =
    payload.questions
      .map((q, index) => ({ q, index }))
      .filter(({ q, index }) => {
        const userAnswer = payload.userAnswers[index];
        return (
          userAnswer !== undefined &&
          userAnswer !== null &&
          userAnswer !== q.correct_answer
        );
      })
      .map(({ q, index }) => {
        const userAnswer = payload.userAnswers[index];
        const attempts = payload.changeCounts[index] ?? 0;
        return `- Question #${index + 1}: "${q.question}" | Your Answer: "${userAnswer}" | Correct Answer: "${q.correct_answer}" | Attempts: ${attempts}`;
      })
      .join("\n") || "No incorrect answers.";

  const prompt = `
You are an AI assistant analyzing a quiz result. 
Write a friendly, precise and motivational analysis in English.

Quiz metadata:
- Test ID: ${payload.testId}
- Category ID: ${payload.categoryId}
- Category: ${payload.questions[0]?.category || "Unknown"}
- Difficulty: ${payload.difficulty}
- Type: ${payload.type}
- Selected Question Count: ${payload.amount}

Score summary:
- Total Questions: ${payload.questions.length}
- Answered Questions: ${answeredQuestions}
- Unanswered Questions: ${unansweredCount}
- Correct Answers: ${correctCount}
- Wrong Answers: ${wrongCount}

Answer behavior:
- Total Attempts Across All Questions: ${totalAttempts}
- Average Attempts Per Question: ${avgAttempts.toFixed(2)}
- Maximum Attempts Used On A Single Question: ${maxAttempts}

Incorrectly answered questions (if any):
${incorrectDetails}

Please write the analysis in the following Markdown format:

### Overall Performance
(Briefly summarize how the user performed in the quiz, taking difficulty and question count into account.)

### Question Behavior And Attempts
(Explain how the number of attempts per question reflects the user's confidence or hesitation. Mention if they often changed answers.)

### Areas to Improve
(Suggest what topics might need more study based on the wrong answers and question categories.)

### Motivation
(End with an encouraging message. Be supportive and constructive.)
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI analysis could not be generated. Please try again.";
  }
};
