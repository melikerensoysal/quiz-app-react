import { useEffect, useCallback } from "react";
import type { Question } from "../types";

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
  setShowWarningModal: (v: boolean) => void;
  setShowTimeUpModal: (v: boolean) => void;
  isQuizInitialized: boolean;
  userAnswers: Record<number, string>;
  changeCounts: Record<number, number>;
  currentQuestionIndex: number;
  timeLeft: number;
  questions: Question[] | null | undefined;
  setTestId: (v: string) => void;
}

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
  setShowWarningModal,
  setShowTimeUpModal,
  isQuizInitialized,
  userAnswers,
  changeCounts,
  currentQuestionIndex,
  timeLeft,
  questions,
  setTestId,
}: QuizPersistenceProps) => {
  const quizKey = `quizState_${categoryId}`;

  const saveState = useCallback(
    (testId: string) => {
      if (!isQuizInitialized) return;
      const quizState = {
        testId,
        userAnswers,
        changeCounts,
        currentQuestionIndex,
        timeLeft,
        categoryId,
        questions,
      };
      localStorage.setItem(quizKey, JSON.stringify(quizState));
    },
    [
      userAnswers,
      changeCounts,
      currentQuestionIndex,
      timeLeft,
      categoryId,
      questions,
      isQuizInitialized,
    ]
  );

  useEffect(() => {
    const saved = localStorage.getItem(quizKey);
    if (saved && !isQuizInitialized) {
      const parsed = JSON.parse(saved);
      if (parsed?.categoryId === categoryId) {
        if (parsed.questions) setLocalQuestions(parsed.questions);
        setUserAnswers(parsed.userAnswers || {});
        setChangeCounts(parsed.changeCounts || {});
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setTimeLeft(parsed.timeLeft || 0);
        setIsQuizInitialized(true);
        setTimerActive(true);
        setShowWarningModal(false);
        setShowTimeUpModal(false);
        setTestId(parsed.testId || crypto.randomUUID());
        return;
      }
    }

    if (questionsFromApi && questionsFromApi.length > 0 && !isQuizInitialized) {
      const newTestId = crypto.randomUUID();
      setLocalQuestions(questionsFromApi);
      setUserAnswers({});
      setChangeCounts({});
      setCurrentQuestionIndex(0);
      setTimeLeft(questionsFromApi.length * 60);
      setIsQuizInitialized(true);
      setTimerActive(true);
      setShowWarningModal(false);
      setShowTimeUpModal(false);
      setTestId(newTestId);
      saveState(newTestId);
    }
  }, [
    isQuizInitialized,
    questionsFromApi,
    categoryId,
    quizKey,
    setLocalQuestions,
    setUserAnswers,
    setChangeCounts,
    setCurrentQuestionIndex,
    setTimeLeft,
    setIsQuizInitialized,
    setTimerActive,
    setShowWarningModal,
    setShowTimeUpModal,
    saveState,
    setTestId,
  ]);

  useEffect(() => {
    const stored = localStorage.getItem(quizKey);
    const parsed = stored ? JSON.parse(stored) : null;
    const testId = parsed?.testId || crypto.randomUUID();
    saveState(testId);
  }, [
    userAnswers,
    changeCounts,
    currentQuestionIndex,
    timeLeft,
    isQuizInitialized,
    saveState,
  ]);

  useEffect(() => {
    if (!isQuizInitialized) return;
    const interval = setInterval(() => {
      const stored = localStorage.getItem(quizKey);
      const parsed = stored ? JSON.parse(stored) : null;
      const testId = parsed?.testId || crypto.randomUUID();
      saveState(testId);
    }, 30000);
    return () => clearInterval(interval);
  }, [isQuizInitialized, quizKey, saveState]);

  useEffect(() => {
    if (!isQuizInitialized) return;
    const handleBeforeUnload = () => {
      const stored = localStorage.getItem(quizKey);
      const parsed = stored ? JSON.parse(stored) : null;
      const testId = parsed?.testId || crypto.randomUUID();
      saveState(testId);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isQuizInitialized, saveState, quizKey]);
};
