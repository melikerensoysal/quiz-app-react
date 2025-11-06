import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/home-page/home-page";
import QuizPage from "./pages/QuizPage/quiz-page";
import ResultPage from "./pages/result-page/result-page";
import { PATHS } from "./constants/paths";

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path={PATHS.HOME} element={<HomePage />} />
        <Route path={PATHS.QUIZ} element={<QuizPage />} />
        <Route path={PATHS.RESULT} element={<ResultPage />} />
      </Routes>
    </div>
  );
}

export default App;