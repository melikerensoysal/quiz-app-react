import { useQuestions } from "../hooks/useQuestions";

function QuestionsCard({ categoryId }: { categoryId: number }) {
  const { data, isLoading, error } = useQuestions(categoryId);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

  return (
    <div>
      {data?.map((q, i) => (
        <p key={i}>{q.question}</p>
      ))}
    </div>
  );
}

export default QuestionsCard;
