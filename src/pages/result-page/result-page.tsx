import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuizAnalysis } from "../../api/gemini-api";
import { useEffect } from "react";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner";
import type { Question } from "../../types";
import styles from "./result-page.module.scss";
import { PATHS } from "../../constants/paths";
import DOMPurify from "dompurify";
import { QUERY_KEYS } from "../../constants/query-keys";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { mutate: generateAnalysis, data: analysis, isPending, isError } = useMutation({
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
    if (!questions || !categoryId) return;
    const path = PATHS.QUIZ.replace(":categoryId", categoryId.toString());
    navigate(path, {
      state: {
        questions,
        retry: true,
      },
    });
  };

  const handleStartNewTest = () => {
    if (!categoryId) return;
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.QUESTIONS, categoryId],
    });
    const refreshToken = Date.now();
    const path = PATHS.QUIZ.replace(":categoryId", categoryId.toString());
    navigate(path, { state: { refreshToken } });
  };

  if (isPending || !analysis) {
    return <LoadingSpinner text="AI is analyzing your results..." />;
  }

  if (isError) {
    return (
      <div className={styles["result-container"]}>
        <div className={styles.error}>
          An error occurred while generating the analysis. Please try again later.
        </div>
        <button onClick={() => navigate(PATHS.HOME)} className={styles["nav-button"]}>
          Home
        </button>
      </div>
    );
  }

  const formatAnalysis = (text: string) => {
    let html = text
      .replace(/### (.*)/g, "<h3>$1</h3>")
      .replace(/# (.*)/g, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^- (.*)/gm, "<li>$1</li>")
      .replace(/\n/g, "<br />")
      .replace(/<br \/><li>/g, "<li>");
    html = html.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
    html = html.replace(/<\/ul><br \/><ul>/g, "");
    return html;
  };

  const sanitizedAnalysis = DOMPurify.sanitize(formatAnalysis(analysis));

  return (
    <div className={styles["result-container"]}>
      <h1 className={styles.title}>Quiz Result Analysis</h1>
      <div
        className={styles["analysis-box"]}
        dangerouslySetInnerHTML={{ __html: sanitizedAnalysis }}
      />
      <div className={styles["button-group"]}>
        <button onClick={handleRetrySameTest} className={styles["nav-button"]}>
          Retry the Same Test
        </button>
        <button onClick={handleStartNewTest} className={styles["nav-button"]}>
          Start a New Test
        </button>
        <button onClick={() => navigate(PATHS.HOME)} className={styles["nav-button"]}>
          Home
        </button>
      </div>
    </div>
  );
};

export default ResultPage;