import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuestions } from "../../hooks/useQuestions";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import styles from "./QuizPage.module.scss";

const QuizPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const numericCategoryId = categoryId ? Number(categoryId) : null;

  const { data: questions, isLoading, isError, error } = useQuestions(numericCategoryId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const shuffledAnswers = useMemo(() => {
    if (!questions) return [];
    return questions.map((q) =>
      [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5)
    );
  }, [questions]);

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
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
  
  if (isLoading) {
    return <LoadingSpinner text="Sorular yükleniyor..." />;
  }

  if (isError || !questions || questions.length === 0) {
    return <div className={styles.error}>Hata: {error?.message || "Sorular yüklenemedi."}</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentShuffledAnswers = shuffledAnswers[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];

  return (
    <div className={styles.quizContainer}>
      <div className={styles.progressHeader}>
        <span className={styles.categoryName}>{currentQuestion.category}</span>
        <span className={styles.progressCounter}>Soru {currentQuestionIndex + 1} / {questions.length}</span>
      </div>

      <div className={styles.questionCard}>
        <h2 className={styles.questionText}>{currentQuestion.question}</h2>
        <div className={styles.answersGrid}>
          {currentShuffledAnswers.map((answer) => (
            <button
              key={answer}
              className={`${styles.answerButton} ${selectedAnswer === answer ? styles.selected : ""}`}
              onClick={() => handleAnswerSelect(answer)}
            >
              {answer}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.navigationButtons}>
        <button onClick={handlePrev} disabled={currentQuestionIndex === 0}>Geri</button>
        <button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>İleri</button>
      </div>
      
      {/**/}
      <div className={styles.finishButtonContainer}>
        <button className={styles.finishButton}>Testi Bitir</button>
      </div>
    </div>
  );
};

export default QuizPage;