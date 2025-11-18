import { STORAGE_KEYS } from "../constants/storage-keys";
import type { Question } from "../types";

export interface QuizState {
  testId: string;
  categoryId: number;
  questions: Question[];
  shuffledAnswers: string[][];
  userAnswers: Record<number, string>;
  changeCounts: Record<number, number>;
  currentQuestionIndex: number;
  timeLeft: number;
}

export interface QuizAnalysis {
  testId: string;
  categoryId: number;
  questions: Question[];
  userAnswers: Record<number, string>;
}

const QUIZ_STATE_KEY = STORAGE_KEYS.QUIZ_STATE;
const QUIZ_ANALYSIS_KEY = STORAGE_KEYS.QUIZ_ANALYSIS;

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const quizStorage = {
  loadState(): QuizState | null {
    const raw = localStorage.getItem(QUIZ_STATE_KEY);
    const parsed = safeParse<QuizState>(raw);
    if (!parsed) {
      localStorage.removeItem(QUIZ_STATE_KEY);
      return null;
    }
    return parsed;
  },

  saveState(state: QuizState): void {
    try {
      localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
    } catch {
    }
  },

  clearState(): void {
    localStorage.removeItem(QUIZ_STATE_KEY);
  },

  loadAnalysis(): QuizAnalysis | null {
    const raw = localStorage.getItem(QUIZ_ANALYSIS_KEY);
    const parsed = safeParse<QuizAnalysis>(raw);
    if (!parsed) {
      localStorage.removeItem(QUIZ_ANALYSIS_KEY);
      return null;
    }
    return parsed;
  },

  saveAnalysis(analysis: QuizAnalysis): void {
    try {
      localStorage.setItem(QUIZ_ANALYSIS_KEY, JSON.stringify(analysis));
    } catch {
    }
  },

  clearAnalysis(): void {
    localStorage.removeItem(QUIZ_ANALYSIS_KEY);
  },
};