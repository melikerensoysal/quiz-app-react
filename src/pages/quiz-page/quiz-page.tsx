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

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const QuizPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const numericCategoryId = categoryId ? Number(categoryId) : null;
  const locationState = (location.state as {
    refreshToken?: number;
    retry?: boolean;
    questions?: Question[];
  }) || null;
  const refreshToken = locationState?.refreshToken;
  const retryQuestions =
    locationState?.retry && Array.isArray(locationState?.questions)
      ? (locationState.questions as Question[])
      : null;

  const [localQuestions, setLocalQuestions] = useState<Question[] | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[][]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [changeCounts, setChangeCounts] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isQuizInitialized, setIsQuizInitialized] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [showNoAnswersModal, setShowNoAnswersModal] = useState(false);
  const [testId, setTestId] = useState<string>("");
  const quizCompletedKey =
    numericCategoryId !== null ? `quizCompleted_${numericCategoryId}` : null;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCategoryId = retryQuestions ? null : numericCategoryId;

  const {
    data: questionsFromApi,
    isLoading,
    isError,
    error,
  } = useQuestions(fetchCategoryId, refreshToken);

  const initialQuestions = retryQuestions ?? questionsFromApi;
  const questions = localQuestions || initialQuestions;

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
    timeLeft,
    questions,
    setTestId,
    shuffledAnswers,
    setShuffledAnswers,
  });

  useEffect(() => {
    if (!timerActive) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setShowTimeUpModal(true);
          return 0;
        }
        const updated = prev - 1;
        if (updated === 60 && !showWarningModal) setShowWarningModal(true);
        return updated;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  useEffect(() => {
    const handleUnload = () => {
      if (numericCategoryId)
        localStorage.setItem(
          `quizTime_${numericCategoryId}`,
          JSON.stringify(timeLeft)
        );
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [timeLeft, numericCategoryId]);

  const handleFinishTest = useCallback(() => {
    if (!questions) return;
    const answeredCount = Object.keys(userAnswers).length;

    if (answeredCount === 0) {
      setShowNoAnswersModal(true);
      return;
    }

    if (numericCategoryId) {
      localStorage.removeItem(`quizState_${numericCategoryId}`);
      localStorage.removeItem(`quizId_${numericCategoryId}`);
      if (quizCompletedKey) {
        localStorage.setItem(quizCompletedKey, "true");
      }
    }

    navigate(PATHS.RESULT, {
      state: { questions, userAnswers, categoryId: numericCategoryId, testId },
    });
  }, [
    navigate,
    questions,
    userAnswers,
    numericCategoryId,
    testId,
    quizCompletedKey,
  ]);

  const handleNoAnswersClose = useCallback(() => {
    setShowNoAnswersModal(false);
    navigate(PATHS.HOME);
  }, [navigate]);

  const handleAnswerSelect = (answer: string) => {
    const currentChanges = changeCounts[currentQuestionIndex] || 0;
    const currentAnswer = userAnswers[currentQuestionIndex];
    if (currentAnswer === answer) return;

    if (currentChanges >= 3) {
      setShowAttemptModal(true);
      return;
    }

    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
    setChangeCounts((prev) => ({
      ...prev,
      [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + 1,
    }));
  };

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1)
      setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((prev) => prev - 1);
  };

  if (isError)
    return (
      <div className={styles.error}>
        Error: {error?.message || "Could not load questions."}
      </div>
    );

  if (isLoading || !isQuizInitialized)
    return <LoadingSpinner text="Loading questions..." />;

  if (!questions || questions.length === 0)
    return (
      <div className={styles.error}>
        Error: No questions available for this category. Please try another.
      </div>
    );

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

      <Modal
        show={showTimeUpModal}
        title="Time's Up!"
        onClose={handleFinishTest}
      >
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
        <p>You need to answer at least one question before finishing the test.</p>
      </Modal>

      <div className={styles["progress-header"]}>
        <span className={styles["category-name"]}>
          {he.decode(currentQuestion.category)}
        </span>
        <span
          className={styles["timer"]}
          style={{
            color: timeLeft <= 60 ? "#e74c3c" : "#3498db",
            transition: "color 0.5s ease-in-out",
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
                (changeCounts[currentQuestionIndex] || 0) >= 3 &&
                userAnswers[currentQuestionIndex] !== answer
              }
            >
              {he.decode(answer)}
            </button>
          ))}
        </div>

        {(changeCounts[currentQuestionIndex] || 0) >= 3 && (
          <p className={styles["locked-warning"]}>
            You have used all your attempts for this question.
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
