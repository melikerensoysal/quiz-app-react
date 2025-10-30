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
  navigate(`${PATHS.QUIZ}/${categoryId}`);
};

  if (isLoading) {
    return <LoadingSpinner text="Kategoriler yükleniyor..." />;
  }

  if (isError) {
    return <div className={styles.error}>{error.message}</div>;
  }

  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.title}>Quiz Uygulaması</h1>
      <h2 className={styles.subtitle}>Başlamak için bir kategori seçin</h2>
      <div className={styles.categoryGrid}>
        {categories?.map((category) => (
          <button
            key={category.id}
            className={styles.categoryCard}
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