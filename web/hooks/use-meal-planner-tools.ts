import { useEffect } from "react";
import type { Meal } from "@/types/meal";

type ModelTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};

type ModelContext = {
  registerTool: (tool: ModelTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

type ToolOptions = {
  plan: Meal[];
  lockedIds: Set<string>;
  catalogIds: Set<string>;
  onShuffle: () => void;
  onSetLocks: (mealIds: string[]) => void;
};

export function useMealPlannerTools({ plan, lockedIds, catalogIds, onShuffle, onSetLocks }: ToolOptions) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const options = { signal: lifecycle.signal };
    const register = (tool: ModelTool) => {
      try {
        void Promise.resolve(context.registerTool(tool, options)).catch(() => undefined);
      } catch {
        // WebMCP is progressive enhancement; the visible controls remain available.
      }
    };

    register({
      name: "get_meal_plan",
      title: "Get meal plan",
      description: "Read the four current dinner suggestions and which ones are locked.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        meals: plan.map((meal) => ({ id: meal.id, name: meal.name, locked: lockedIds.has(meal.id) })),
      }),
    });

    register({
      name: "shuffle_unlocked_meals",
      title: "Shuffle unlocked meals",
      description: "Replace every unlocked dinner suggestion while keeping locked meals in place.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        onShuffle();
        return { status: "shuffled", lockedCount: lockedIds.size };
      },
    });

    register({
      name: "set_meal_locks",
      title: "Set meal locks",
      description: "Lock the supplied meals in the current plan and unlock all other meals.",
      inputSchema: {
        type: "object",
        properties: { mealIds: { type: "array", items: { type: "string" }, uniqueItems: true } },
        required: ["mealIds"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const mealIds = (input as { mealIds?: unknown }).mealIds;
        if (!Array.isArray(mealIds) || mealIds.some((id) => typeof id !== "string" || !catalogIds.has(id))) {
          throw new Error("mealIds must contain valid meal IDs.");
        }
        const visibleIds = new Set(plan.map((meal) => meal.id));
        if (mealIds.some((id) => !visibleIds.has(id))) {
          throw new Error("Only meals in the current plan can be locked.");
        }
        onSetLocks(mealIds);
        return { status: "updated", lockedMealIds: mealIds };
      },
    });

    return () => lifecycle.abort();
  }, [catalogIds, lockedIds, onSetLocks, onShuffle, plan]);
}
