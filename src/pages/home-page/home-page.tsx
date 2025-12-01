import React, { useEffect, useState } from "react";
import { useCategories } from "../../hooks/use-categories";
import type { CategoryWithStats } from "../../hooks/use-categories";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner";
import styles from "./home-page.module.scss";
import { PATHS } from "../../constants/paths";
import Modal from "../../components/modal/modal";

interface CategoryQuestionCount {
  total_question_count: number;
  total_easy_question_count: number;
  total_medium_question_count: number;
  total_hard_question_count: number;
}

const CategoryStatsCard: React.FC<{ category: CategoryWithStats, openModal: (id: number) => void }> = ({ category, openModal }) => {
  const { total, approved, pending, rejected } = category.stats;
  
  return (
    <div className={styles["category-card"]}>
      <h3 className={styles["category-name"]}>{category.name}</h3>

      <div className={styles["stats-display"]}>
        <p>
          Total Questions: <span className={styles.total}>{total}</span>
        </p>
        <p>
          ✅ Approved: <span className={styles.approved}>{approved}</span>
        </p>
        <p>
          ⏳ Pending: <span className={styles.pending}>{pending}</span>
        </p>
        <p>
          ❌ Rejected: <span className={styles.rejected}>{rejected}</span>
        </p>
      </div>
      
      <button 
        className={styles["start-quiz-button"]}
        onClick={() => openModal(category.id)}
      >
        Start Quiz
      </button>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading, isError, error } = useCategories();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [categoryCounts, setCategoryCounts] = useState<CategoryQuestionCount | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  const [difficulty, setDifficulty] = useState("easy");
  const [type, setType] = useState("multiple");
  const [amount, setAmount] = useState(10);

  useEffect(() => {
    const pageTitle = "Quiz App - Home";
    const description = "Welcome to the React Quiz App! Choose a category and configure your quiz.";
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

  const openConfigModal = async (categoryId: number) => {
    setSelectedCategory(categoryId);
    setShowConfigModal(true);
    setCategoryCounts(null);
    setIsLoadingCounts(true);

    try {
      const response = await fetch(`https://opentdb.com/api_count.php?category=${categoryId}`);
      const data = await response.json();
      setCategoryCounts(data.category_question_count);
      
      setDifficulty("easy");
      setAmount(10);
    } catch (error) {
      console.error("Failed to fetch category counts", error);
    } finally {
      setIsLoadingCounts(false);
    }
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

  const categoriesWithStats = categories as CategoryWithStats[];

  const isOptionDisabled = (count: number) => {
    return count < amount;
  };

  const isCurrentSelectionInvalid = () => {
    if (!categoryCounts) return false;
    let limit = 0;
    if (difficulty === 'easy') limit = categoryCounts.total_easy_question_count;
    if (difficulty === 'medium') limit = categoryCounts.total_medium_question_count;
    if (difficulty === 'hard') limit = categoryCounts.total_hard_question_count;
    
    return limit < amount;
  };

  return (
    <div className={styles["home-container"]}>
      <h1 className={styles.title}>Quiz Application</h1>
      <h2 className={styles.subtitle}>Select a category to get started</h2>

      <div className={styles["category-grid"]}>
        {categoriesWithStats?.map((category) => (
          <CategoryStatsCard 
            key={category.id}
            category={category}
            openModal={openConfigModal}
          />
        ))}
      </div>

      <Modal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Quiz Settings"
      >
        <div className={styles["config-modal"]}>
          {isLoadingCounts ? (
             <div style={{ textAlign: 'center', padding: '20px' }}>Checking questions...</div>
          ) : (
            <>
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

              <div className={styles["config-field"]}>
                <label>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ 
                    borderColor: isCurrentSelectionInvalid() ? 'red' : undefined 
                  }}
                >
                  <option 
                    value="easy" 
                    disabled={categoryCounts ? isOptionDisabled(categoryCounts.total_easy_question_count) : false}
                  >
                    Easy {categoryCounts ? `(${categoryCounts.total_easy_question_count})` : ''}
                  </option>
                  <option 
                    value="medium"
                    disabled={categoryCounts ? isOptionDisabled(categoryCounts.total_medium_question_count) : false}
                  >
                    Medium {categoryCounts ? `(${categoryCounts.total_medium_question_count})` : ''}
                  </option>
                  <option 
                    value="hard"
                    disabled={categoryCounts ? isOptionDisabled(categoryCounts.total_hard_question_count) : false}
                  >
                    Hard {categoryCounts ? `(${categoryCounts.total_hard_question_count})` : ''}
                  </option>
                </select>
                {isCurrentSelectionInvalid() && (
                  <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
                    Not enough questions in this difficulty for the selected amount.
                  </small>
                )}
              </div>

              <div className={styles["config-field"]}>
                <label>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="multiple">Multiple Choice</option>
                  <option value="boolean">True / False</option>
                </select>
              </div>

              <button 
                className={styles["start-button"]} 
                onClick={startQuiz}
                disabled={isCurrentSelectionInvalid()}
                style={{ opacity: isCurrentSelectionInvalid() ? 0.5 : 1 }}
              >
                Start Quiz
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;