import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { PATHS } from "./constants/paths";
import LoadingSpinner from "./components/loading-spinner/loading-spinner";
import HomePage from "./pages/home-page/home-page";

const QuizPage = lazy(() => import("./pages/quiz-page/quiz-page"));
const ResultPage = lazy(() => import("./pages/result-page/result-page"));

function App() {
  return (
    <div className="app-container">
      <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
        <Routes>
          <Route path={PATHS.HOME} element={<HomePage />} />
          <Route path={PATHS.QUIZ} element={<QuizPage />} />
          <Route path={PATHS.RESULT} element={<ResultPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
