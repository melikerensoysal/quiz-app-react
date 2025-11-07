import { useEffect } from "react";
import { useCategories } from "../../hooks/use-categories";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner";
import styles from "./home-page.module.scss";
import { PATHS } from "../../constants/paths";

const HomePage = () => {
  const navigate = useNavigate();
  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useCategories();

  useEffect(() => {
    const pageTitle = "Quiz App - Home";
    const description =
      "Welcome to the React Quiz App! Choose a category and test your knowledge with fun quizzes.";
    const url = "https://quiz-app-react-blush.vercel.app/";

    document.title = pageTitle;

    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    const setMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property='${property}']`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    setMeta("og:title", pageTitle);
    setMeta("og:description", description);
    setMeta("og:url", url);
    setMeta("og:type", "website");

    const setTwitter = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name='${name}']`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    setTwitter("twitter:card", "summary_large_image");
    setTwitter("twitter:title", pageTitle);
    setTwitter("twitter:description", description);
  }, []);

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
