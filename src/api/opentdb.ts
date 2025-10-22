export async function fetchCategories() {
  const res = await fetch("https://opentdb.com/api_category.php");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return data.trivia_categories;
}

export async function fetchQuestions(categoryId: number, amount: number = 10) {
  const res = await fetch(`https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&type=multiple`);
  if (!res.ok) throw new Error("Failed to fetch questions");
  const data = await res.json();
  return data.results;
}
