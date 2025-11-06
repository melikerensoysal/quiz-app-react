import { useCategories } from "../../hooks/useCategories";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import styles from "./HomePage.module.scss";
import { PATHS } from "../../constants/paths";

const HomePage = () => {
  const navigate = useNavigate();
  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useCategories();

  const handleCategorySelect = (categoryId: number) => {
    const path = PATHS.QUIZ.replace(":categoryId", categoryId.toString());
    navigate(path);
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
            onClick={() => handleCategorySelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;