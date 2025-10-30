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
    // Mevcut soruları state ile QuizPage'e geri gönderiyoruz
    navigate(`${PATHS.QUIZ}/${categoryId}`, {
      state: {
        questions,
      },
    });
  };

  const handleStartNewTest = () => {
    if (!categoryId) return;
    // Sadece categoryId ile gidersek, QuizPage API'den yeni soru çeker
    navigate(`${PATHS.QUIZ}/${categoryId}`);
  };

  if (isPending || !analysis) {
    return <LoadingSpinner text="Yapay zeka sizin için sonuçları analiz ediyor..." />;
  }

  if (isError) {
    return (
      <div className={styles.resultContainer}>
        <div className={styles.error}>
          Analiz oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
        <button onClick={() => navigate(PATHS.HOME)} className={styles.navButton}>Anasayfa</button>
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
      <h1 className={styles.title}>Test Sonuç Analizi</h1>
      <div className={styles.analysisBox} dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }} />
      
      <div className={styles.buttonGroup}>
        <button onClick={handleRetrySameTest} className={styles.navButton}>Aynı Testi Yeniden Çöz</button>
        <button onClick={handleStartNewTest} className={styles.navButton}>Yeni Teste Başla</button>
        <button onClick={() => navigate(PATHS.HOME)} className={styles.navButton}>Anasayfa</button>
      </div>
    </div>
  );
};

export default ResultPage;