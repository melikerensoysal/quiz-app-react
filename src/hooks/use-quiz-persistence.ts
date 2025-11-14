import { useEffect, useCallback, useRef } from "react";
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
  const quizKey = `quizState_${categoryId ?? "unknown"}`;
  const quizIdKey = `quizId_${categoryId ?? "unknown"}`;
  const quizCompletedKey = `quizCompleted_${categoryId ?? "unknown"}`;
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);


  const saveState = useCallback(() => {
    if (!isQuizInitialized || categoryId === null) return;

    const quizState = {
      categoryId,
      questions,
      userAnswers,
      changeCounts,
      currentQuestionIndex,
      shuffledAnswers,
      timeLeft: timeLeftRef.current,
    };

    localStorage.setItem(quizKey, JSON.stringify(quizState));
  }, [
    categoryId,
    questions,
    userAnswers,
    changeCounts,
    currentQuestionIndex,
    shuffledAnswers,
    isQuizInitialized,
    quizKey,
  ]);


  useEffect(() => {
    if (!isQuizInitialized || categoryId === null) return;

    let id = localStorage.getItem(quizIdKey);

    if (!id) {
      id = `${quizIdKey}_${Date.now()}`;
      localStorage.setItem(quizIdKey, id);
    }

    setTestId(id);
  }, [isQuizInitialized, quizIdKey, setTestId, categoryId]);


  useEffect(() => {
    if (isQuizInitialized || categoryId === null) return;

    const completedFlag = localStorage.getItem(quizCompletedKey);
    if (completedFlag) {
      localStorage.removeItem(quizKey);
      localStorage.removeItem(quizIdKey);
      localStorage.removeItem(quizCompletedKey);
    }

    const saved = localStorage.getItem(quizKey);
    let parsed: {
      categoryId?: number | null;
      questions?: Question[] | null;
      userAnswers?: Record<number, string>;
      changeCounts?: Record<number, number>;
      currentQuestionIndex?: number;
      shuffledAnswers?: string[][];
      timeLeft?: number;
    } | null = null;

    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch {
        localStorage.removeItem(quizKey);
      }
    }

    if (parsed?.categoryId === categoryId) {
      setLocalQuestions(parsed.questions || null);
      setUserAnswers(parsed.userAnswers || {});
      setChangeCounts(parsed.changeCounts || {});
      setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
      setShuffledAnswers(parsed.shuffledAnswers || []);
      const restoredTime =
        typeof parsed.timeLeft === "number" ? parsed.timeLeft : 600;
      setTimeLeft(restoredTime);

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
      const shuffled = questionsFromApi.map((q) =>
        [...q.incorrect_answers, q.correct_answer].sort(
          () => Math.random() - 0.5
        )
      );

      setLocalQuestions(questionsFromApi);
      setShuffledAnswers(shuffled);
      setUserAnswers({});
      setChangeCounts({});
      setCurrentQuestionIndex(0);

      setTimeLeft(600);
      setIsQuizInitialized(true);
      setTimerActive(true);
    }
  }, [
    isQuizInitialized,
    questionsFromApi,
    categoryId,
    setLocalQuestions,
    setUserAnswers,
    setChangeCounts,
    setCurrentQuestionIndex,
    setShuffledAnswers,
    setTimeLeft,
    setIsQuizInitialized,
    setTimerActive,
    quizKey,
    quizIdKey,
    quizCompletedKey,
  ]);


  useEffect(() => {
    if (!isQuizInitialized || categoryId === null) return;
    saveState();
  }, [
    userAnswers,
    changeCounts,
    currentQuestionIndex,
    shuffledAnswers,
    isQuizInitialized,
    saveState,
  ]);


  useEffect(() => {
    if (!isQuizInitialized) return;
    const interval = setInterval(saveState, 30000);
    return () => clearInterval(interval);
  }, [isQuizInitialized, saveState, categoryId]);


  useEffect(() => {
    if (!isQuizInitialized || categoryId === null) return;

    const handleBeforeUnload = () => saveState();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isQuizInitialized, saveState, categoryId]);
};
