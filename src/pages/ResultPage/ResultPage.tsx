import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { getQuizAnalysis } from "../../api/geminiApi";
import { useEffect } from "react";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import type { Question } from "../../types";
import styles from "./ResultPage.module.scss";
import { PATHS } from "../../constants/paths";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    questions: Question[];
    userAnswers: Record<number, string>;
    categoryId: number;
  } | null;

  const { questions, userAnswers, categoryId } = state || {
    questions: null,
    userAnswers: null,
    categoryId: null,
  };

  const {
    mutate: generateAnalysis,
    data: analysis,
    isPending,
    isError,
  } = useMutation({
    mutationFn: getQuizAnalysis,
  });

  useEffect(() => {
    if (questions && userAnswers) {
      generateAnalysis({ questions, userAnswers });
    } else {
      navigate(PATHS.HOME);
    }
  }, [questions, userAnswers, generateAnalysis, navigate]);

  const handleRetrySameTest = () => {
    if (!questions) return;
    navigate(`${PATHS.QUIZ}/${categoryId}`, {
      state: {
        questions,
      },
    });
  };

  const handleStartNewTest = () => {
    if (!categoryId) return;
    navigate(`${PATHS.QUIZ}/${categoryId}`);
  };

  if (isPending || !analysis) {
    return <LoadingSpinner text="AI is analyzing your results..." />;
  }

  if (isError) {
    return (
      <div className={styles.resultContainer}>
        <div className={styles.error}>
          An error occurred while generating the analysis. Please try again later.
        </div>
        <button onClick={() => navigate(PATHS.HOME)} className={styles.navButton}>Home</button>
      </div>
    );
  }
  
  const formatAnalysis = (text: string) => {
    return text
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/# (.*)/g, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^- (.*)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br />')
      .replace(/<br \/><li>/g, '<li>');
  };

  return (
    <div className={styles.resultContainer}>
      <h1 className={styles.title}>Quiz Result Analysis</h1>
      <div
        className={styles.analysisBox}
        dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
      />
      
      <div className={styles.buttonGroup}>
        <button onClick={handleRetrySameTest} className={styles.navButton}>
          Retry the Same Test
        </button>
        <button onClick={handleStartNewTest} className={styles.navButton}>
          Start a New Test
        </button>
        <button onClick={() => navigate(PATHS.HOME)} className={styles.navButton}>
          Home
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
