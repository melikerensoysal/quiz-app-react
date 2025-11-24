import { useEffect, useState } from "react";
import { useCategories } from "../../hooks/use-categories";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner";
import styles from "./home-page.module.scss";
import { PATHS } from "../../constants/paths";
import Modal from "../../components/modal/modal";

const HomePage = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading, isError, error } = useCategories();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [difficulty, setDifficulty] = useState("easy");
  const [type, setType] = useState("multiple");
  const [amount, setAmount] = useState(10);

  useEffect(() => {
    const pageTitle = "Quiz App - Home";
    const description =
      "Welcome to the React Quiz App! Choose a category and configure your quiz.";
    const url = "https://quiz-app-react-blush.vercel.app/";

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
    ensureMeta("canonical", url);

    ensureMeta("og:title", pageTitle, true);
    ensureMeta("og:description", description, true);
    ensureMeta("og:url", url, true);
    ensureMeta("og:type", "website", true);
    ensureMeta("og:image", `${url}og-image.png`, true);

    ensureMeta("twitter:card", "summary_large_image");
    ensureMeta("twitter:title", pageTitle);
    ensureMeta("twitter:description", description);
    ensureMeta("twitter:image", `${url}og-image.png`);
  }, []);

  const openConfigModal = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setShowConfigModal(true);
  };

  const startQuiz = () => {
    if (!selectedCategory) return;

    const path = PATHS.QUIZ.replace(
      ":categoryId",
      selectedCategory.toString()
    );

    navigate(path, {
      state: {
        amount,
        difficulty,
        type,
        refreshToken: Date.now(),
      },
    });

    setShowConfigModal(false);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading categories..." />;
  }

  if (isError) {
    return <div className={styles.error}>{error.message}</div>;
  }

  return (
    <div className={styles["home-container"]}>
      <h1 className={styles.title}>Quiz Application</h1>
      <h2 className={styles.subtitle}>Select a category to get started</h2>

      <div className={styles["category-grid"]}>
        {categories?.map((category) => (
          <button
            key={category.id}
            className={styles["category-card"]}
            onClick={() => openConfigModal(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <Modal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Quiz Settings"
      >
        <div className={styles["config-modal"]}>
          <div className={styles["config-field"]}>
            <label>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className={styles["config-field"]}>
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="multiple">Multiple Choice</option>
              <option value="boolean">True / False</option>
            </select>
          </div>

          <div className={styles["config-field"]}>
            <label>Number of Questions</label>
            <select
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={25}>25 Questions</option>
            </select>
          </div>

          <button className={styles["start-button"]} onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
