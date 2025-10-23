import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/quiz/:categoryId" element={<QuizPage />} /> */}
        {/* <Route path="/result" element={<ResultPage />} /> */}
      </Routes>
    </div>
  );
}

export default App;