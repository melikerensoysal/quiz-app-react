import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Question } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) throw new Error("Gemini API key not found");

const genAI = new GoogleGenerativeAI(API_KEY);

interface AnalysisPayload {
  questions: Question[];
  userAnswers: Record<number, string>;
}

export const getQuizAnalysis = async (payload: AnalysisPayload): Promise<string> => {
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

  const prompt = `
    You are an AI assistant analyzing a quiz result. 
    Based on the user's performance, write a friendly and motivational analysis in English.

    Category: ${payload.questions[0].category}
    Total Questions: ${payload.questions.length}
    Answered Questions: ${answeredQuestions}
    Unanswered Questions: ${unansweredCount}
    Correct Answers: ${correctCount}
    Wrong Answers: ${wrongCount}

    Incorrectly answered questions (if any):
    ${
      payload.questions
        .filter((q, i) => 
          payload.userAnswers[i] !== undefined &&
          q.correct_answer !== payload.userAnswers[i]
        )
        .map((q, i) => `- Question: "${q.question}" | Your Answer: "${payload.userAnswers[i]}" | Correct Answer: "${q.correct_answer}"`)
        .join("\n") || "No incorrect answers."
    }

    Please write the analysis in the following Markdown format:

    ### Overall Performance
    (Briefly summarize how the user performed in the quiz.)

    ### Areas to Improve
    (Suggest what topics might need more study based on the wrong answers.)

    ### Motivation
    (End with an encouraging message.)
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI analysis could not be generated. Please try again.";
  }
};