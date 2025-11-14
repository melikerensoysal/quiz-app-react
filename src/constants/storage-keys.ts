export const STORAGE_KEYS = {
  QUIZ_STATE: "quizState",
  QUIZ_ANALYSIS: "quizAnalysis",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
