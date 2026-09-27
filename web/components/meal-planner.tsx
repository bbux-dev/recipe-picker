"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles, UtensilsCrossed } from "lucide-react";
import { MealCard } from "@/components/meal-card";
import { Button } from "@/components/ui/button";
import { useMealPlannerTools } from "@/hooks/use-meal-planner-tools";
import { refreshMealPlan } from "@/lib/meal-selection";
import type { Meal } from "@/types/meal";

const STORAGE_KEY = "recipe-picker-plan-v1";

type StoredPlan = {
  mealIds: string[];
  lockedIds: string[];
};

type MealPlannerProps = {
  meals: Meal[];
  initialPlan: Meal[];
};

export function MealPlanner({ meals, initialPlan }: MealPlannerProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [hasLoaded, setHasLoaded] = useState(false);
  const catalogIds = useMemo(() => new Set(meals.map((meal) => meal.id)), [meals]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredPlan;
        const restoredPlan = parsed.mealIds
          .map((id) => meals.find((meal) => meal.id === id))
          .filter((meal): meal is Meal => Boolean(meal));
        if (restoredPlan.length === 4) setPlan(restoredPlan);
        setLockedIds(new Set(parsed.lockedIds));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoaded(true);
    }
  }, [meals]);

  useEffect(() => {
    if (!hasLoaded) return;
    const stored: StoredPlan = {
      mealIds: plan.map((meal) => meal.id),
      lockedIds: [...lockedIds],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [hasLoaded, lockedIds, plan]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Local previews may not serve public assets until their first full reload.
      });
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setPlan((current) => refreshMealPlan(meals, current, lockedIds));
  }, [lockedIds, meals]);

  const handleLockChange = useCallback((mealId: string, locked: boolean) => {
    setLockedIds((current) => {
      const next = new Set(current);
      if (locked) next.add(mealId);
      else next.delete(mealId);
      return next;
    });
  }, []);

  const handleSetLocks = useCallback((mealIds: string[]) => {
    setLockedIds(new Set(mealIds));
  }, []);

  useMealPlannerTools({
    plan,
    lockedIds,
    catalogIds,
    onShuffle: handleRefresh,
    onSetLocks: handleSetLocks,
  });

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7eee8] text-[#321827]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_12%_0%,rgba(245,183,110,0.38),transparent_42%),radial-gradient(circle_at_88%_8%,rgba(163,74,91,0.28),transparent_38%)]" />

      <div className="relative mx-auto max-w-[90rem] px-4 pb-12 pt-6 sm:px-8 sm:pt-9 lg:px-12">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#321827] text-[#ffd88d] shadow-lg shadow-[#6d3b4b]/20">
              <UtensilsCrossed aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-serif text-xl font-bold tracking-[-0.03em]">Recipe Picker</p>
              <p className="text-sm text-[#765d68]">This week&apos;s dinner plan</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-[#d7bbb4] bg-white/45 px-4 py-2 text-sm font-semibold text-[#765d68] backdrop-blur sm:block">
            {lockedIds.size} of 4 saved
          </span>
        </header>

        <section className="mb-8 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#9b4e5b]">
              <Sparkles aria-hidden="true" className="size-4" />
              Four balanced picks
            </p>
            <h1 className="text-balance font-serif text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
              Dinner, decided.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#6c5260] sm:text-lg">
              Lock the meals you want to keep, then shuffle the rest. We&apos;ll balance cuisine, effort, and household favorites.
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleRefresh}
            className="h-14 w-full rounded-2xl bg-[#8d4050] px-6 text-base font-bold text-white shadow-[0_14px_30px_-14px_rgba(83,32,51,0.8)] hover:bg-[#753344] lg:w-auto"
          >
            <RefreshCw aria-hidden="true" className="size-5" />
            Shuffle unlocked meals
          </Button>
        </section>

        <section aria-label="Weekly meal suggestions" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {plan.map((meal, index) => (
            <MealCard
              key={`${index}-${meal.id}`}
              meal={meal}
              index={index}
              locked={lockedIds.has(meal.id)}
              onLockChange={handleLockChange}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
