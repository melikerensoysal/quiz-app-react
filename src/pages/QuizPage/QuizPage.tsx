import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuestions } from "../../hooks/useQuestions";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import Modal from "../../components/Modal/Modal";
import styles from "./QuizPage.module.scss";
import { PATHS } from "../../constants/paths";
import type { Question } from "../../types";

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
  const [timerStarted, setTimerStarted] = useState<boolean>(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  useEffect(() => {
    if (location.state?.forceNew) {
      setLocalQuestions(null);
      setIsQuizInitialized(false);
    }
  }, [location.state]);

  const handleFinishTest = useCallback(() => {
    if (!questions) return;
    navigate(PATHS.RESULT, {
      state: {
        questions,
        userAnswers,
        categoryId: numericCategoryId,
      },
    });
  }, [navigate, questions, userAnswers, numericCategoryId]);

  useEffect(() => {
    if (isQuizInitialized || isLoading) return;

    let newQuestions = null;

    if (location.state?.retry && location.state?.questions) {
      newQuestions = location.state.questions;
      setLocalQuestions(newQuestions);
    } else if (questionsFromApi) {
      newQuestions = questionsFromApi;
      setLocalQuestions(null);
    }

    if (newQuestions) {
      const allShuffled = newQuestions.map((question: Question) =>
        [...question.incorrect_answers, question.correct_answer].sort(
          () => Math.random() - 0.5
        )
      );
      setShuffledAnswers(allShuffled);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setChangeCounts({});
      setTimeLeft(newQuestions.length * 60);
      setShowWarningModal(false);
      setShowTimeUpModal(false);
      setTimerStarted(true);
      setIsQuizInitialized(true);
    }
  }, [location.state, questionsFromApi, isLoading, isQuizInitialized]);

  useEffect(() => {
    if (!timerStarted) return;
    if (timeLeft <= 0) {
      if (questions && questions.length > 0 && !showTimeUpModal) {
        setShowTimeUpModal(true);
      }
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    if (timeLeft === 60) {
      setShowWarningModal(true);
    }
    return () => clearInterval(timerId);
  }, [timeLeft, questions, showTimeUpModal, timerStarted]);

  const handleAnswerSelect = (answer: string) => {
    const currentChanges = changeCounts[currentQuestionIndex] || 0;
    if (currentChanges >= 2) {
      alert("You have used all your attempts for this question!");
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
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
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
  const currentShuffledAnswers = shuffledAnswers[currentQuestionIndex] || [];
  const selectedAnswer = userAnswers[currentQuestionIndex];
  const isAnswerLocked = (changeCounts[currentQuestionIndex] || 0) >= 2;
  const gridStyle =
    currentShuffledAnswers.length === 3 ? { gridTemplateColumns: "1fr" } : {};

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

      <div className={styles["progress-header"]}>
        <span className={styles["category-name"]}>
          {currentQuestion.category}
        </span>
        <span className={styles["timer"]}>{formatTime(timeLeft)}</span>
        <span className={styles["progress-counter"]}>
          Question {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      <div className={styles["question-card"]}>
        <h2 className={styles["question-text"]}>{currentQuestion.question}</h2>
        <div className={styles["answers-grid"]} style={gridStyle}>
          {currentShuffledAnswers.map((answer) => (
            <button
              key={answer}
              className={`${styles["answer-button"]} ${
                selectedAnswer === answer ? styles.selected : ""
              }`}
              onClick={() => handleAnswerSelect(answer)}
              disabled={isAnswerLocked && selectedAnswer !== answer}
            >
              {answer}
            </button>
          ))}
        </div>
        {isAnswerLocked && (
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
        <button
          className={styles["finish-button"]}
          onClick={handleFinishTest}
        >
          Finish Test
        </button>
      </div>
    </div>
  );
};

export default QuizPage;