import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import QuizPage from "./pages/QuizPage/QuizPage";

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Bu rotayı aktif hale getiriyoruz */}
        <Route path="/quiz/:categoryId" element={<QuizPage />} />

        {/* ResultPage rotasını daha sonra ekleyeceğiz */}
        {/* <Route path="/result" element={<ResultPage />} /> */}
      </Routes>
    </div>
  );
}

export default App;