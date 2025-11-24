import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { getQuizAnalysis } from "../../api/gemini-api";
import { useEffect, useState } from "react";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner";
import type { Question } from "../../types";
import styles from "./result-page.module.scss";
import { PATHS } from "../../constants/paths";
import DOMPurify from "dompurify";
import { STORAGE_KEYS } from "../../constants/storage-keys";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state =
    (location.state as {
      questions?: Question[];
      userAnswers?: Record<number, string>;
      categoryId?: number;
      testId?: string;
      amount?: number;
      difficulty?: string;
      type?: string;
      changeCounts?: Record<number, number>;
    }) || {};

  const {
    questions = [],
    userAnswers = {},
    categoryId = null,
    testId = "",
    amount = undefined,
    difficulty = undefined,
    type = undefined,
    changeCounts = {},
  } = state;

  const [cachedAnalysis, setCachedAnalysis] = useState<string | null>(null);

  const {
    mutate: generateAnalysis,
    data: analysis,
    isPending,
    isError,
  } = useMutation({
    mutationFn: getQuizAnalysis,
    onSuccess: (data) => {
      if (testId) {
        const payload = JSON.stringify({ testId, analysis: data });
        localStorage.setItem(STORAGE_KEYS.QUIZ_ANALYSIS, payload);
      }
    },
  });

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.QUIZ_STATE);
  }, []);

  useEffect(() => {
    const pageTitle = "Quiz Results - React Quiz App";
    const description =
      "View your quiz results and detailed AI-based analysis.";
    const url = "https://quiz-app-react-blush.vercel.app/result";

    document.title = pageTitle;

    const ensureMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty
        ? `meta[property='${name}']`
        : `meta[name='${name}']`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(isProperty ? "property" : "name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    ensureMeta("description", description);
    ensureMeta("og:title", pageTitle, true);
    ensureMeta("og:description", description, true);
    ensureMeta("og:url", url, true);
    ensureMeta("og:type", "website", true);
    ensureMeta("twitter:card", "summary_large_image");
    ensureMeta("twitter:title", pageTitle);
    ensureMeta("twitter:description", description);
  }, []);

  useEffect(() => {
    if (!questions || !userAnswers || !testId || !categoryId) {
      navigate(PATHS.HOME);
      return;
    }

    const safeAmount = amount ?? questions.length;
    const safeDifficulty = difficulty ?? "unknown";
    const safeType = type ?? "multiple";
    const safeChangeCounts = changeCounts ?? {};

    const cached = localStorage.getItem(STORAGE_KEYS.QUIZ_ANALYSIS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.testId === testId && typeof parsed.analysis === "string") {
          setCachedAnalysis(parsed.analysis);
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.QUIZ_ANALYSIS);
      }
    }

    generateAnalysis({
      questions,
      userAnswers,
      categoryId,
      testId,
      amount: safeAmount,
      difficulty: safeDifficulty,
      type: safeType,
      changeCounts: safeChangeCounts,
    });
  }, [
    questions,
    userAnswers,
    testId,
    categoryId,
    amount,
    difficulty,
    type,
    changeCounts,
    generateAnalysis,
    navigate,
  ]);

  if ((isPending && !cachedAnalysis) || (!analysis && !cachedAnalysis)) {
    return <LoadingSpinner text="AI is analyzing your results..." />;
  }

  const clearAnalysisCache = () => {
    localStorage.removeItem(STORAGE_KEYS.QUIZ_ANALYSIS);
  };

  if (isError) {
    return (
      <div className={styles["result-container"]}>
        <div className={styles.error}>
          An error occurred while generating the analysis.
        </div>
        <button
          onClick={() => {
            clearAnalysisCache();
            navigate(PATHS.HOME);
          }}
          className={styles["nav-button"]}
        >
          Home
        </button>
      </div>
    );
  }

  const finalAnalysis = cachedAnalysis || analysis || "";
  const html = DOMPurify.sanitize(
    finalAnalysis
      .replace(/### (.*)/g, "<h3>$1</h3>")
      .replace(/# (.*)/g, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^- (.*)/gm, "<li>$1</li>")
      .replace(/\n/g, "<br />")
      .replace(/<br \/><li>/g, "<li>")
      .replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>")
      .replace(/<\/ul><br \/><ul>/g, "")
  );

  const safeAmount = amount ?? questions.length;
  const safeDifficulty = difficulty ?? "unknown";
  const safeType = type ?? "multiple";

  const handleRetrySameTest = () => {
    if (!questions || !categoryId) return;
    clearAnalysisCache();
    navigate(PATHS.QUIZ.replace(":categoryId", categoryId.toString()), {
      state: {
        questions,
        retry: true,
        amount: safeAmount,
        difficulty: safeDifficulty,
        type: safeType,
      },
    });
  };

  const handleStartNewTest = () => {
    if (!categoryId) return;
    clearAnalysisCache();
    navigate(PATHS.QUIZ.replace(":categoryId", categoryId.toString()), {
      state: {
        refreshToken: Date.now(),
        amount: safeAmount,
        difficulty: safeDifficulty,
        type: safeType,
      },
    });
  };

  return (
    <div className={styles["result-container"]}>
      <h1 className={styles.title}>Quiz Result Analysis</h1>

      <div
        className={styles["analysis-box"]}
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>

      <div className={styles["button-group"]}>
        <button onClick={handleRetrySameTest} className={styles["nav-button"]}>
          Retry the Same Test
        </button>
        <button onClick={handleStartNewTest} className={styles["nav-button"]}>
          Start a New Test
        </button>
        <button
          onClick={() => navigate(PATHS.HOME)}
          className={styles["nav-button"]}
        >
          Home
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
