import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuestions } from "../../hooks/use-questions";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner";
import styles from "./quiz-page.module.scss";
import { PATHS } from "../../constants/paths";
import he from "he";
import type { Question } from "../../types";
import Modal from "../../components/modal/modal";

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
  const {
    data: questionsFromApi,
    isLoading,
    isError,
    error,
  } = useQuestions(localQuestions ? null : numericCategoryId, refreshToken);

  const questions = localQuestions || questionsFromApi;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [changeCounts, setChangeCounts] = useState<Record<number, number>>({});
  const [shuffledAnswers, setShuffledAnswers] = useState<string[][]>([]);
  const [isQuizInitialized, setIsQuizInitialized] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showAttemptModal, setShowAttemptModal] = useState(false);

  useEffect(() => {
    const currentTitle = categoryId
      ? `Quiz ${categoryId} - React Quiz App`
      : "Quiz - React Quiz App";
    document.title = currentTitle;

    const descriptionContent = categoryId
      ? `Answer questions in Quiz ${categoryId} and test your knowledge using this interactive React app.`
      : "Answer quiz questions and test your knowledge with this interactive React app.";

    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", descriptionContent);

    const setMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property='${property}']`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    setMeta("og:title", currentTitle);
    setMeta("og:description", descriptionContent);
    setMeta("og:type", "website");
  }, [categoryId]);

  useEffect(() => {
    if (location.state?.forceNew) {
      setLocalQuestions(null);
      setIsQuizInitialized(false);
    }
  }, [location.state]);

  const handleFinishTest = useCallback(() => {
    if (!questions) return;

    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === 0) {
      alert("You must answer at least one question before finishing the test!");
      return;
    }

    localStorage.removeItem("quizState");
    navigate(PATHS.RESULT, {
      state: { questions, userAnswers, categoryId: numericCategoryId },
    });
  }, [navigate, questions, userAnswers, numericCategoryId]);

  useEffect(() => {
    if (isQuizInitialized || isLoading) return;
    let newQuestions: Question[] | null = null;
    if (location.state?.retry && location.state?.questions) {
      newQuestions = location.state.questions;
      setLocalQuestions(newQuestions);
    } else if (questionsFromApi) {
      newQuestions = questionsFromApi;
      setLocalQuestions(null);
    }
    if (newQuestions && newQuestions.length > 0) {
      const shuffled = newQuestions.map((q) =>
        [...q.incorrect_answers, q.correct_answer].sort(
          () => Math.random() - 0.5
        )
      );
      setShuffledAnswers(shuffled);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setChangeCounts({});
      setTimeLeft(newQuestions.length * 60);
      setShowWarningModal(false);
      setShowTimeUpModal(false);
      setTimerActive(true);
      setIsQuizInitialized(true);
    }
  }, [location.state, questionsFromApi, isLoading, isQuizInitialized]);

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

  const handleAnswerSelect = (answer: string) => {
    const currentChanges = changeCounts[currentQuestionIndex] || 0;

    if (currentChanges === 2) {
      setChangeCounts((prev) => ({
        ...prev,
        [currentQuestionIndex]: currentChanges + 1,
      }));
      setShowAttemptModal(true);
      return;
    }

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
  const currentAnswers = shuffledAnswers[currentQuestionIndex] || [];
  const selectedAnswer = userAnswers[currentQuestionIndex];
  const isLocked = (changeCounts[currentQuestionIndex] || 0) >= 3;
  const gridStyle =
    currentAnswers.length === 3 ? { gridTemplateColumns: "1fr" } : {};

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
            fontWeight: 600,
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
        <div className={styles["answers-grid"]} style={gridStyle}>
          {currentAnswers.map((answer) => (
            <button
              key={answer}
              className={`${styles["answer-button"]} ${
                selectedAnswer === answer ? styles.selected : ""
              }`}
              onClick={() => handleAnswerSelect(answer)}
              disabled={isLocked && selectedAnswer !== answer}
            >
              {he.decode(answer)}
            </button>
          ))}
        </div>
        {isLocked && (
          <p className={styles["locked-warning"]}>
            You have used all attempts for this question.
          </p>
        )}
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
