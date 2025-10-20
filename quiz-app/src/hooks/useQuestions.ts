import { useEffect, useState } from "react";
import { fetchQuestions } from "../api/opentdb";

export function useQuestions(categoryId: number, amount: number = 10) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;

    setLoading(true);
    fetchQuestions(categoryId, amount)
      .then((data) => setQuestions(data))
      .catch(() => setError("Failed to load questions"))
      .finally(() => setLoading(false));
  }, [categoryId, amount]);

  return { questions, loading, error };
}
