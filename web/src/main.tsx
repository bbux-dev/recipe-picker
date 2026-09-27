import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MealPlanner } from "@/components/meal-planner";
import { meals } from "@/data/meals";
import { selectMeals } from "@/lib/meal-selection";
import "../app/globals.css";

const initialPlan = selectMeals(meals, { random: () => 0.42 });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MealPlanner meals={meals} initialPlan={initialPlan} />
  </StrictMode>,
);
