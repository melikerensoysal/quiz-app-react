import React from "react";
import type { Category } from "../types"; // 'type' kelimesi eklendi

interface CategorySelectProps {
  categories: Category[];
  onCategorySelect: (categoryId: number) => void;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  categories,
  onCategorySelect,
}) => {
  return (
    <div>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategorySelect;