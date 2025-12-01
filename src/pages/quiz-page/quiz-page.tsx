import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuestions } from "../../hooks/use-questions";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner";
import styles from "./quiz-page.module.scss";
import { PATHS } from "../../constants/paths";
import he from "he";
import type { Question } from "../../types";
import Modal from "../../components/modal/modal";
import { useQuizPersistence } from "../../hooks/use-quiz-persistence";
import { quizStorage } from "../../services/quiz-storage";
import ErrorCover from "../../components/error-cover/error-cover";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const MAX_ATTEMPTS_PER_QUESTION = 3;

const QuizPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const numericCategoryId = categoryId ? Number(categoryId) : null;

  const locationState = (location.state as {
    amount?: number;
    difficulty?: string;
    type?: string;
    refreshToken?: number;
    retry?: boolean;
    questions?: Question[];
  }) || {};

  const amount = locationState.amount ?? 10;
  const difficulty = locationState.difficulty ?? "easy";
  const type = locationState.type ?? "multiple";
  const refreshToken = locationState.refreshToken;

  const retryQuestions =
    locationState.retry && Array.isArray(locationState.questions)
      ? (locationState.questions as Question[])
      : null;

  const [localQuestions, setLocalQuestions] = useState<Question[] | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[][]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [changeCounts, setChangeCounts] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState<number>(amount * 60);
  
  const [persistedTimeLeft, setPersistedTimeLeft] = useState<number | null>(null);
  const [isQuizInitialized, setIsQuizInitialized] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [showNoAnswersModal, setShowNoAnswersModal] = useState(false);
  const [testId, setTestId] = useState<string>("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTimeSyncedRef = useRef(false);

  const {
    data: questionsFromApi,
    isLoading,
    isError,
    error,
  } = useQuestions(numericCategoryId, amount, difficulty, type, refreshToken);

  const initialQuestions = retryQuestions ?? questionsFromApi ?? null;
  const questions = localQuestions || initialQuestions || null;

  useEffect(() => {
    if (questions && questions.length > 0) {
        const requiredTime = questions.length * 60;
        
        if (Math.abs(timeLeft - requiredTime) > 5 && !isTimeSyncedRef.current) {
            setTimeLeft(requiredTime);
            isTimeSyncedRef.current = true;
        }
    }
  }, [questions, timeLeft]);

  useEffect(() => {
    if (!isQuizInitialized) return;

    setPersistedTimeLeft((prev) => {
      if (!timerActive) {
        return prev === null ? timeLeft : prev;
      }

      if (prev === null) return timeLeft;

      const shouldPersist =
        timeLeft === 0 ||
        timeLeft === 60 ||
        timeLeft % 30 === 0 ||
        Math.abs(timeLeft - prev) >= 30;

      if (shouldPersist && timeLeft !== prev) return timeLeft;

      return prev;
    });
  }, [timeLeft, isQuizInitialized, timerActive]);

  useQuizPersistence({
    categoryId: numericCategoryId,
    questionsFromApi: initialQuestions,
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
    timeLeft: persistedTimeLeft ?? timeLeft,
    questions,
    setTestId,
    testId,
    shuffledAnswers,
    setShuffledAnswers,
  });

  useEffect(() => {
    if (!timerActive) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setShowTimeUpModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive]);

  useEffect(() => {
    if (timeLeft === 60) setShowWarningModal(true);
  }, [timeLeft]);

  const resetQuizSession = useCallback(() => {
    timerRef.current && clearInterval(timerRef.current);
    setTimerActive(false);
    setIsQuizInitialized(false);
    setLocalQuestions(null);
    setShuffledAnswers([]);
    setUserAnswers({});
    setChangeCounts({});
    setCurrentQuestionIndex(0);
    setTimeLeft(amount * 60);
    isTimeSyncedRef.current = false;
    setPersistedTimeLeft(null);
    setTestId("");
    quizStorage.clearState();
    quizStorage.clearAnalysis();
  }, [amount]);

  const handleFinishTest = useCallback(() => {
    if (!questions) return;

    if (Object.keys(userAnswers).length === 0) {
      setShowNoAnswersModal(true);
      return;
    }

    resetQuizSession();

    navigate(PATHS.RESULT, {
      state: {
        questions,
        userAnswers,
        categoryId: numericCategoryId,
        testId,
        amount,
        difficulty,
        type,
        changeCounts,
      },
    });
  }, [
    navigate,
    questions,
    userAnswers,
    numericCategoryId,
    testId,
    amount,
    difficulty,
    type,
    changeCounts,
    resetQuizSession,
  ]);

  const handleNoAnswersClose = useCallback(() => {
    setShowNoAnswersModal(false);
    resetQuizSession();
    navigate(PATHS.HOME);
  }, [navigate, resetQuizSession]);

  const handleAnswerSelect = (answer: string) => {
    const currentAttempts = changeCounts[currentQuestionIndex] || 0;
    const currentAnswer = userAnswers[currentQuestionIndex];

    if (currentAnswer === answer) return;

    if (currentAttempts >= MAX_ATTEMPTS_PER_QUESTION) {
      setShowAttemptModal(true);
      return;
    }

    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
    setChangeCounts((prev) => ({
      ...prev,
      [currentQuestionIndex]: currentAttempts + 1,
    }));
  };

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };


  if (isError)
    return (
      <ErrorCover 
        title="Oops!"
        message={error?.message || "Sorular yüklenirken bir sorun oluştu."}
        icon="🔌"
      />
    );

  if (!isQuizInitialized || !questions) {
    return (
      <LoadingSpinner
        text={isLoading ? "Loading questions..." : "Preparing quiz..."}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <ErrorCover 
        title="Soru Bulunamadı"
        message="Seçtiğiniz kriterlere (Kategori/Zorluk) uygun yeterli soru veritabanında bulunmuyor. Lütfen daha az soru sayısı veya farklı bir kategori seçin."
        icon="🧩"
        buttonText="Ayarlara Dön"
      />
    );
  }


  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswers = shuffledAnswers[currentQuestionIndex] || [];

  return (
    <div className={styles["quiz-container"]}>
      <Modal
        show={showWarningModal}
        title="Time Warning"
        onClose={() => setShowWarningModal(false)}
      >
        <p>You have 1 minute left to complete the quiz!</p>
      </Modal>

      <Modal show={showTimeUpModal} title="Time's Up!" onClose={handleFinishTest}>
        <p>Your time has expired.</p>
      </Modal>

      <Modal
        show={showAttemptModal}
        title="Answer Limit Reached"
        onClose={() => setShowAttemptModal(false)}
      >
        <p>You have used all your attempts for this question!</p>
      </Modal>

      <Modal
        show={showNoAnswersModal}
        title="No Answers Submitted"
        onClose={handleNoAnswersClose}
      >
        <p>You need to answer at least one question before finishing.</p>
      </Modal>

      <div className={styles["progress-header"]}>
        <span className={styles["category-name"]}>
          {he.decode(currentQuestion.category)}
        </span>

        <span
          className={styles["timer"]}
          style={{
            color: timeLeft <= 60 ? "#e74c3c" : "#3498db",
            transition: "color 0.5s",
          }}
        >
          {formatTime(timeLeft)}
        </span>

        <span className={styles["progress-counter"]}>
          Question {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      <div className={styles["question-card"]}>
        <h2 className={styles["question-text"]}>
          {he.decode(currentQuestion.question)}
        </h2>

        <div className={styles["answers-grid"]}>
          {currentAnswers.map((answer) => (
            <button
              key={answer}
              className={`${styles["answer-button"]} ${
                userAnswers[currentQuestionIndex] === answer
                  ? styles.selected
                  : ""
              }`}
              onClick={() => handleAnswerSelect(answer)}
              disabled={
                (changeCounts[currentQuestionIndex] || 0) >=
                  MAX_ATTEMPTS_PER_QUESTION &&
                userAnswers[currentQuestionIndex] !== answer
              }
            >
              {he.decode(answer)}
            </button>
          ))}
        </div>

        {(changeCounts[currentQuestionIndex] || 0) >=
          MAX_ATTEMPTS_PER_QUESTION && (
          <p className={styles["locked-warning"]}>
            You have used all your attempts.
          </p>
        )}
      </div>

      <div className={styles["bottom-inline"]}>
        <button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
          Previous
        </button>

        <button className={styles["finish-inline"]} onClick={handleFinishTest}>
          Finish Test
        </button>

        <button
          onClick={handleNext}
          disabled={
            currentQuestionIndex === questions.length - 1 ||
            !userAnswers[currentQuestionIndex]
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default QuizPage;