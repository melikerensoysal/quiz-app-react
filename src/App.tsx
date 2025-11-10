import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { PATHS } from "./constants/paths";

const HomePage = lazy(() => import("./pages/home-page/home-page"));
const QuizPage = lazy(() => import("./pages/quiz-page/quiz-page"));
const ResultPage = lazy(() => import("./pages/result-page/result-page"));

function App() {
  return (
    <div className="app-container">
      <Suspense fallback={<div>Loading...</div>}>
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
