import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuestions } from "../../hooks/useQuestions";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import styles from "./QuizPage.module.scss";
import { PATHS } from "../../constants/paths";

const QuizPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const numericCategoryId = categoryId ? Number(categoryId) : null;

  const {
    data: questions,
    isLoading,
    isError,
    error,
  } = useQuestions(numericCategoryId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [changeCounts, setChangeCounts] = useState<Record<number, number>>({});

  const shuffledAnswers = useMemo(() => {
    if (!questions) return [];
    return questions.map((question) =>
      [...question.incorrect_answers, question.correct_answer].sort(
        () => Math.random() - 0.5
      )
    );
  }, [questions]);

  const handleAnswerSelect = (answer: string) => {
    const currentChanges = changeCounts[currentQuestionIndex] || 0;
    if (currentChanges >= 2) {
      alert("Bu soru için cevap değiştirme hakkınız doldu!");
      return;
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));

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

  const handleFinishTest = () => {
    if (!questions) return;
    navigate(PATHS.RESULT, {
      state: {
        questions,
        userAnswers,
      },
    });
  };

  if (isLoading) {
    return <LoadingSpinner text="Sorular yükleniyor..." />;
  }

  if (isError || !questions || questions.length === 0) {
    return (
      <div className={styles.error}>
        Hata: {error?.message || "Sorular yüklenemedi."}
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentShuffledAnswers = shuffledAnswers[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];
  const isAnswerLocked = (changeCounts[currentQuestionIndex] || 0) >= 2;
  const allQuestionsAnswered =
    Object.keys(userAnswers).length === questions.length;

  return (
    <div className={styles.quizContainer}>
      <div className={styles.progressHeader}>
        <span className={styles.categoryName}>{currentQuestion.category}</span>
        <span className={styles.progressCounter}>
          Soru {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      <div className={styles.questionCard}>
        <h2 className={styles.questionText}>{currentQuestion.question}</h2>
        <div className={styles.answersGrid}>
          {currentShuffledAnswers.map((answer) => (
            <button
              key={answer} // Cevap metinleri bir soru içinde benzersizdir, bu yüzden key olarak kullanılabilir.
              className={`${styles.answerButton} ${
                selectedAnswer === answer ? styles.selected : ""
              }`}
              onClick={() => handleAnswerSelect(answer)}
              disabled={isAnswerLocked}
            >
              {answer}
            </button>
          ))}
        </div>
        {isAnswerLocked && (
          <p className={styles.lockedMessage}>
            Bu soru için cevap hakkınız doldu.
          </p>
        )}
      </div>

      <div className={styles.navigationButtons}>
        <button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
          Geri
        </button>
        <button
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          İleri
        </button>
      </div>

      <div className={styles.finishButtonContainer}>
        <button
          className={styles.finishButton}
          onClick={handleFinishTest}
          disabled={!allQuestionsAnswered}
        >
          Testi Bitir
        </button>
      </div>
    </div>
  );
};

export default QuizPage;