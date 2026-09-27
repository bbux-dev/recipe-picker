import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MealCard } from "@/components/meal-card";
import type { Meal } from "@/types/meal";

const testMeal: Meal = {
  id: "tacos",
  name: "Tacos",
  ethnicity: "Mexican",
  difficulty: "easy",
  image: "/assets/tacos.png",
  dislikedBy: [],
};

describe("MealCard", () => {
  it("renders meal details and exposes the lock action", () => {
    const onLockChange = vi.fn();
    render(<MealCard meal={testMeal} index={0} locked={false} onLockChange={onLockChange} />);

    expect(screen.getByRole("heading", { name: "Tacos" })).toBeTruthy();
    expect(screen.getByText("Mexican")).toBeTruthy();
    expect(screen.getByText("Easy night")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "Lock Tacos" }));
    expect(onLockChange).toHaveBeenCalledWith("tacos", true);
  });
});
