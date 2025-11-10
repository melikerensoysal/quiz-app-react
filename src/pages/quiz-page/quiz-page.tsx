import { useState, useEffect, useCallback } from "react";
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
  const { refreshToken } = location.state || {};

  const [localQuestions, setLocalQuestions] = useState<Question[] | null>(null);
  const shouldFetch =
    !localStorage.getItem(`quizState_${numericCategoryId}`) && !localQuestions;
  const {
    data: questionsFromApi,
    isLoading,
    isError,
    error,
  } = useQuestions(shouldFetch ? numericCategoryId : null, refreshToken);

  const questions = localQuestions || questionsFromApi;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [changeCounts, setChangeCounts] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isQuizInitialized, setIsQuizInitialized] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [testId, setTestId] = useState<string>("");

  useQuizPersistence({
    categoryId: numericCategoryId,
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
  });

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) {
      if (!showTimeUpModal) setShowTimeUpModal(true);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        const updated = prev - 1;
        if (updated === 60 && !showWarningModal) setShowWarningModal(true);
        return updated;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, timerActive, showWarningModal, showTimeUpModal]);

  const handleFinishTest = useCallback(() => {
    if (!questions) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === 0) {
      alert("You must answer at least one question before finishing the test!");
      return;
    }
    localStorage.removeItem(`quizState_${numericCategoryId}`);
    navigate(PATHS.RESULT, {
      state: { questions, userAnswers, categoryId: numericCategoryId, testId },
    });
  }, [navigate, questions, userAnswers, numericCategoryId, testId]);

  const handleAnswerSelect = (answer: string) => {
    const currentChanges = changeCounts[currentQuestionIndex] || 0;
    const currentAnswer = userAnswers[currentQuestionIndex];
    if (currentChanges >= 3) {
      setShowAttemptModal(true);
      return;
    }
    if (currentAnswer === answer) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
    setChangeCounts((prev) => ({
      ...prev,
      [currentQuestionIndex]: currentChanges + 1,
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

  if (isLoading || !isQuizInitialized) {
    return <LoadingSpinner text="Loading questions..." />;
  }

  if (isError || !questions || questions.length === 0) {
    return (
      <div className={styles.error}>
        Error: {error?.message || "Could not load questions."}
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answers = [
    ...currentQuestion.incorrect_answers,
    currentQuestion.correct_answer,
  ].sort(() => Math.random() - 0.5);

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
        <p>Your time has expired. Your results will now be analyzed.</p>
      </Modal>
      <Modal
        show={showAttemptModal}
        title="Answer Limit Reached"
        onClose={() => setShowAttemptModal(false)}
      >
        <p>You have used all your attempts for this question!</p>
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
          {answers.map((answer) => (
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
      </div>
      <div className={styles["navigation-buttons"]}>
        <button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
          Previous
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
      <div className={styles["finish-button-container"]}>
        <button className={styles["finish-button"]} onClick={handleFinishTest}>
          Finish Test
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
