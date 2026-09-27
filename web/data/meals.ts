import mealData from "./meals.json";
import type { Difficulty, Meal } from "@/types/meal";

type RawMeal = {
  name: string;
  ethnicity?: string;
  difficulty?: string;
  image?: string;
  disliked_by?: string[];
  seasonal?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeDifficulty(value?: string): Difficulty {
  return value === "medium" || value === "hard" ? value : "easy";
}

export const meals: Meal[] = (mealData as RawMeal[]).map((meal) => ({
  id: slugify(meal.name),
  name: meal.name,
  ethnicity: meal.ethnicity || "Various",
  difficulty: normalizeDifficulty(meal.difficulty),
  image: `/${(meal.image || "")
    .replace(/\.png\.png$/, ".png")
    .replace(/\.png$/, ".webp")}`,
  dislikedBy: meal.disliked_by || [],
  seasonal: meal.seasonal,
}));
