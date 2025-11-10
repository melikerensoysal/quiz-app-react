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
  shuffledAnswers: string[][];
  setShuffledAnswers: (v: string[][]) => void;
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
  shuffledAnswers,
  setShuffledAnswers,
}: QuizPersistenceProps) => {
  const quizKey = `quizState_${categoryId}`;
  const quizIdKey = `quizId_${categoryId}`;

  const saveState = useCallback(() => {
    if (!isQuizInitialized) return;
    const quizState = {
      userAnswers,
      changeCounts,
      currentQuestionIndex,
      timeLeft,
      categoryId,
      questions,
      shuffledAnswers,
    };
    localStorage.setItem(quizKey, JSON.stringify(quizState));
  }, [
    userAnswers,
    changeCounts,
    currentQuestionIndex,
    timeLeft,
    categoryId,
    questions,
    shuffledAnswers,
    isQuizInitialized,
  ]);

  useEffect(() => {
    if (!isQuizInitialized) return;
    if (!localStorage.getItem(quizIdKey)) {
      const id = `${quizIdKey}_${Date.now()}`;
      localStorage.setItem(quizIdKey, id);
      setTestId(id);
    } else {
      const existingId = localStorage.getItem(quizIdKey) || "";
      setTestId(existingId);
    }
  }, [isQuizInitialized, quizIdKey, setTestId]);

  useEffect(() => {
    if (isQuizInitialized) return;
    const saved = localStorage.getItem(quizKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.categoryId === categoryId) {
        if (parsed.questions) setLocalQuestions(parsed.questions);
        setUserAnswers(parsed.userAnswers || {});
        setChangeCounts(parsed.changeCounts || {});
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setTimeLeft(parsed.timeLeft || 0);
        setShuffledAnswers(parsed.shuffledAnswers || []);
        setIsQuizInitialized(true);
        setTimerActive(true);
        setShowWarningModal(false);
        setShowTimeUpModal(false);
        return;
      }
    }

    if (questionsFromApi && questionsFromApi.length > 0) {
      const shuffled = questionsFromApi.map((q) =>
        [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5)
      );
      setShuffledAnswers(shuffled);
      setLocalQuestions(questionsFromApi);
      setUserAnswers({});
      setChangeCounts({});
      setCurrentQuestionIndex(0);
      setTimeLeft(questionsFromApi.length * 60);
      setIsQuizInitialized(true);
      setTimerActive(true);
      setShowWarningModal(false);
      setShowTimeUpModal(false);
    }
  }, [
    isQuizInitialized,
    questionsFromApi,
    categoryId,
    setLocalQuestions,
    setUserAnswers,
    setChangeCounts,
    setCurrentQuestionIndex,
    setTimeLeft,
    setIsQuizInitialized,
    setTimerActive,
    setShowWarningModal,
    setShowTimeUpModal,
    setShuffledAnswers,
    quizKey,
  ]);

  useEffect(() => {
    if (!isQuizInitialized) return;
    saveState();
  }, [userAnswers, changeCounts, currentQuestionIndex, isQuizInitialized, saveState]);

  useEffect(() => {
    if (!isQuizInitialized) return;
    const interval = setInterval(saveState, 30000);
    return () => clearInterval(interval);
  }, [isQuizInitialized, saveState]);

  useEffect(() => {
    if (!isQuizInitialized) return;
    const handleBeforeUnload = () => saveState();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isQuizInitialized, saveState]);
};
