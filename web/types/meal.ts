export type Difficulty = "easy" | "medium" | "hard";

export interface Meal {
  id: string;
  name: string;
  ethnicity: string;
  difficulty: Difficulty;
  image: string;
  dislikedBy: string[];
  seasonal?: string;
}
