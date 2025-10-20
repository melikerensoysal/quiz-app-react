import { useEffect, useState } from "react";
import { fetchCategories } from "../api/opentdb";

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch(() => setError("Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error };
}
