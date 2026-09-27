import type { Meal } from "@/types/meal";

export type SelectionOptions = {
  count?: number;
  maxHard?: number;
  random?: () => number;
};

export function shuffle<T>(items: readonly T[], random: () => number = Math.random) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function selectMeals(
  catalog: readonly Meal[],
  { count = 4, maxHard = 1, random = Math.random }: SelectionOptions = {},
) {
  const selected: Meal[] = [];
  const cuisines = new Set<string>();
  let hardCount = 0;
  let dislikedCount = 0;

  for (const meal of shuffle(catalog, random)) {
    const repeatsCuisine = meal.ethnicity !== "American" && cuisines.has(meal.ethnicity);
    const exceedsHardLimit = meal.difficulty === "hard" && hardCount >= maxHard;
    const exceedsDislikedLimit = meal.dislikedBy.length > 0 && dislikedCount >= 1;

    if (repeatsCuisine || exceedsHardLimit || exceedsDislikedLimit) continue;

    selected.push(meal);
    cuisines.add(meal.ethnicity);
    if (meal.difficulty === "hard") hardCount += 1;
    if (meal.dislikedBy.length > 0) dislikedCount += 1;
    if (selected.length === count) break;
  }

  return selected;
}

export function refreshMealPlan(
  catalog: readonly Meal[],
  currentPlan: readonly Meal[],
  lockedIds: ReadonlySet<string>,
  random: () => number = Math.random,
) {
  const lockedMeals = currentPlan.filter((meal) => lockedIds.has(meal.id));
  const currentIds = new Set(currentPlan.map((meal) => meal.id));
  const available = catalog.filter((meal) => !currentIds.has(meal.id));
  const replacements = selectMeals(available, {
    count: Math.max(0, 4 - lockedMeals.length),
    maxHard: lockedMeals.some((meal) => meal.difficulty === "hard") ? 0 : 1,
    random,
  });

  let replacementIndex = 0;
  return Array.from({ length: 4 }, (_, index) => {
    const currentMeal = currentPlan[index];
    if (currentMeal && lockedIds.has(currentMeal.id)) return currentMeal;
    const replacement = replacements[replacementIndex];
    replacementIndex += 1;
    return replacement;
  }).filter((meal): meal is Meal => Boolean(meal));
}
