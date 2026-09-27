import { describe, expect, it } from "vitest";
import { refreshMealPlan, selectMeals } from "@/lib/meal-selection";
import type { Difficulty, Meal } from "@/types/meal";

function meal(
  id: string,
  ethnicity: string,
  difficulty: Difficulty = "easy",
  dislikedBy: string[] = [],
): Meal {
  return { id, name: id, ethnicity, difficulty, dislikedBy, image: `/${id}.png` };
}

const catalog = [
  meal("tacos", "Mexican"),
  meal("enchiladas", "Mexican"),
  meal("pasta", "Italian"),
  meal("risotto", "Italian", "hard", ["Jane"]),
  meal("burger", "American"),
  meal("potato", "American"),
  meal("curry", "Indian", "hard"),
  meal("ramen", "Japanese", "medium"),
  meal("salad", "Salad", "easy", ["Lena"]),
];

describe("selectMeals", () => {
  it("returns four varied meals without mutating the catalog", () => {
    const originalIds = catalog.map(({ id }) => id);
    const selected = selectMeals(catalog, { random: () => 0.1 });

    expect(selected).toHaveLength(4);
    expect(catalog.map(({ id }) => id)).toEqual(originalIds);
    expect(selected.filter(({ difficulty }) => difficulty === "hard").length).toBeLessThanOrEqual(1);
    expect(selected.filter(({ dislikedBy }) => dislikedBy.length > 0).length).toBeLessThanOrEqual(1);

    const nonAmericanCuisines = selected
      .filter(({ ethnicity }) => ethnicity !== "American")
      .map(({ ethnicity }) => ethnicity);
    expect(new Set(nonAmericanCuisines).size).toBe(nonAmericanCuisines.length);
  });
});

describe("refreshMealPlan", () => {
  it("keeps locked slots and replaces every unlocked meal", () => {
    const current = catalog.slice(0, 4);
    const lockedIds = new Set([current[1].id]);
    const refreshed = refreshMealPlan(catalog, current, lockedIds, () => 0.2);

    expect(refreshed).toHaveLength(4);
    expect(refreshed[1]).toBe(current[1]);
    expect(refreshed[0].id).not.toBe(current[0].id);
    expect(refreshed[2].id).not.toBe(current[2].id);
    expect(refreshed[3].id).not.toBe(current[3].id);
  });
});
