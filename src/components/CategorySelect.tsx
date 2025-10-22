import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default interface Category {
  id: number;
  name: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await axios.get("https://opentdb.com/api_category.php");
  return data.trivia_categories;
};

export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
};
