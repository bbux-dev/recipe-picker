import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppMenu } from "@/components/app-menu";
import type { Meal } from "@/types/meal";

const meals: Meal[] = [
  {
    id: "impossible-spaghetti",
    name: "Impossible Spaghetti",
    ethnicity: "Italian",
    difficulty: "easy",
    image: "/assets/vegspaghetti.webp",
    dislikedBy: [],
  },
  {
    id: "roasted-veggie-burritos",
    name: "Roasted Veggie Burritos",
    ethnicity: "Mexican",
    difficulty: "medium",
    image: "/assets/burritos.webp",
    dislikedBy: [],
  },
];

describe("AppMenu", () => {
  it("opens the full meal catalog from the menu", async () => {
    const user = userEvent.setup();
    render(<AppMenu meals={meals} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("menuitem", { name: /View All/ }));

    expect(screen.getByRole("dialog", { name: "All meals" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Impossible Spaghetti" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Roasted Veggie Burritos" })).toBeTruthy();
  });
});
