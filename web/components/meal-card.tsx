import { Lock, LockOpen, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Meal } from "@/types/meal";

type MealCardProps = {
  meal: Meal;
  index: number;
  locked: boolean;
  onLockChange: (mealId: string, locked: boolean) => void;
};

const difficultyLabels = {
  easy: "Easy night",
  medium: "A little cooking",
  hard: "Weekend energy",
} as const;

export function MealCard({ meal, index, locked, onLockChange }: MealCardProps) {
  const lockId = `lock-${meal.id}`;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_22px_70px_-35px_rgba(50,23,35,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-34px_rgba(50,23,35,0.65)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eaded5]">
        {/* Images are pre-optimized WebP assets and do not need a server-side image loader. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meal.image}
          alt={meal.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-[#fff8ee]/92 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#633447] backdrop-blur">
          Night {index + 1}
        </span>
        <span className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-1 text-sm font-medium text-white backdrop-blur-md">
          {difficultyLabels[meal.difficulty]}
        </span>
      </div>

      <div className="flex min-h-36 flex-col justify-between gap-5 p-5 sm:p-6">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#a2545f]">{meal.ethnicity}</p>
          <h2 className="text-balance font-serif text-[1.65rem] font-semibold leading-[1.08] tracking-[-0.025em] text-[#321827]">
            {meal.name}
          </h2>
          {meal.dislikedBy.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-[#765d68]">
              <Users aria-hidden="true" className="size-4" />
              Not a favorite for {meal.dislikedBy.join(", ")}
            </p>
          )}
        </div>

        <label
          htmlFor={lockId}
          className="flex cursor-pointer items-center justify-between rounded-2xl bg-[#f7eee8] px-4 py-3 text-sm font-semibold text-[#573344] transition hover:bg-[#f1e3dc]"
        >
          <span className="flex items-center gap-2">
            {locked ? <Lock aria-hidden="true" className="size-4" /> : <LockOpen aria-hidden="true" className="size-4" />}
            {locked ? "Saved for this week" : "Keep this one"}
          </span>
          <Checkbox
            id={lockId}
            checked={locked}
            onCheckedChange={(checked) => onLockChange(meal.id, checked === true)}
            aria-label={`${locked ? "Unlock" : "Lock"} ${meal.name}`}
            className="size-5 border-[#b67b83] data-[state=checked]:border-[#8d4050] data-[state=checked]:bg-[#8d4050]"
          />
        </label>
      </div>
    </article>
  );
}
