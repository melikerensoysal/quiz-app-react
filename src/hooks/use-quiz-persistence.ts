import { useEffect } from "react";
import type { Question } from "../types";
import { quizStorage, type QuizState } from "../services/quiz-storage";

interface QuizPersistenceProps {
  categoryId: number | null;
  questionsFromApi: Question[] | null | undefined;

  setLocalQuestions: (q: Question[] | null) => void;
  setUserAnswers: (v: Record<number, string>) => void;
  setChangeCounts: (v: Record<number, number>) => void;
  setCurrentQuestionIndex: (v: number) => void;
  setTimeLeft: (v: number) => void;
  setIsQuizInitialized: (v: boolean) => void;
  setTimerActive: (v: boolean) => void;

  isQuizInitialized: boolean;
  userAnswers: Record<number, string>;
  changeCounts: Record<number, number>;
  currentQuestionIndex: number;
  timeLeft: number;
  questions: Question[] | null | undefined;

  setTestId: (v: string) => void;
  testId: string;

  shuffledAnswers: string[][];
  setShuffledAnswers: (v: string[][]) => void;
}

const DEFAULT_DURATION_SECONDS = 600;

export const useQuizPersistence = ({
  categoryId,
  questionsFromApi,
  setLocalQuestions,
  setUserAnswers,
  setChangeCounts,
  setCurrentQuestionIndex,
  setTimeLeft,
  setIsQuizInitialized,
  setTimerActive,
  isQuizInitialized,
  userAnswers,
  changeCounts,
  currentQuestionIndex,
  timeLeft,
  questions,
  setTestId,
  testId,
  shuffledAnswers,
  setShuffledAnswers,
}: QuizPersistenceProps) => {
  useEffect(() => {
    if (isQuizInitialized || categoryId === null) return;

    const saved = quizStorage.loadState();

    if (saved && saved.categoryId === categoryId) {
      setTestId(saved.testId);
      setLocalQuestions(saved.questions);
      setShuffledAnswers(saved.shuffledAnswers);
      setUserAnswers(saved.userAnswers);
      setChangeCounts(saved.changeCounts);
      setCurrentQuestionIndex(saved.currentQuestionIndex);
      setTimeLeft(saved.timeLeft);
      setIsQuizInitialized(true);
      setTimerActive(true);
      return;
    }

    if (questionsFromApi && questionsFromApi.length === 0) {
      setLocalQuestions([]);
      setShuffledAnswers([]);
      setUserAnswers({});
      setChangeCounts({});
      setCurrentQuestionIndex(0);
      setTimeLeft(0);
      setIsQuizInitialized(true);
      setTimerActive(false);
      return;
    }

    if (questionsFromApi && questionsFromApi.length > 0) {
      const newTestId = `quiz_${categoryId}_${Date.now()}`;
      const shuffled = questionsFromApi.map((q) =>
        [...q.incorrect_answers, q.correct_answer].sort(
          () => Math.random() - 0.5
        )
      );

      setTestId(newTestId);
      setLocalQuestions(questionsFromApi);
      setShuffledAnswers(shuffled);
      setUserAnswers({});
      setChangeCounts({});
      setCurrentQuestionIndex(0);
      setTimeLeft(DEFAULT_DURATION_SECONDS);
      setIsQuizInitialized(true);
      setTimerActive(true);
    }
  }, [
    isQuizInitialized,
    categoryId,
    questionsFromApi,
    setLocalQuestions,
    setUserAnswers,
    setChangeCounts,
    setCurrentQuestionIndex,
    setShuffledAnswers,
    setTimeLeft,
    setIsQuizInitialized,
    setTimerActive,
    setTestId,
  ]);

  useEffect(() => {
    if (!isQuizInitialized) return;
    if (categoryId === null) return;
    if (!questions || questions.length === 0) return;

    const state: QuizState = {
      testId,
      categoryId,
      questions,
      shuffledAnswers,
      userAnswers,
      changeCounts,
      currentQuestionIndex,
      timeLeft,
    };

    quizStorage.saveState(state);
  }, [
    isQuizInitialized,
    categoryId,
    questions,
    shuffledAnswers,
    userAnswers,
    changeCounts,
    currentQuestionIndex,
    timeLeft,
    testId,
  ]);
};