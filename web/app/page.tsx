import { MealPlanner } from "@/components/meal-planner";
import { meals } from "@/data/meals";
import { selectMeals } from "@/lib/meal-selection";

export default function Home() {
  const initialPlan = selectMeals(meals, { random: () => 0.42 });

  return <MealPlanner meals={meals} initialPlan={initialPlan} />;
}
