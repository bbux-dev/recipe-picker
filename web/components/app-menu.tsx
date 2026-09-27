"use client";

import { BookOpen, Menu, X } from "lucide-react";
import { Dialog, DropdownMenu } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/types/meal";

type AppMenuProps = {
  meals: Meal[];
};

const difficultyLabels = {
  easy: "Easy night",
  medium: "A little cooking",
  hard: "Weekend energy",
} as const;

export function AppMenu({ meals }: AppMenuProps) {
  return (
    <Dialog.Root>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Open menu"
            className="size-11 rounded-2xl border-[#d7bbb4] bg-white/55 text-[#573344] shadow-sm backdrop-blur hover:bg-white/80"
          >
            <Menu aria-hidden="true" className="size-5" />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-40 min-w-52 rounded-2xl border border-[#dbc2bc] bg-[#fffaf6] p-2 text-[#321827] shadow-[0_20px_55px_-22px_rgba(50,24,39,0.55)]"
          >
            <DropdownMenu.Label className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#9b4e5b]">
              Recipes
            </DropdownMenu.Label>
            <Dialog.Trigger asChild>
              <DropdownMenu.Item className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition data-[highlighted]:bg-[#f1e3dc]">
                <BookOpen aria-hidden="true" className="size-4" />
                <span className="flex-1">View All</span>
                <span className="rounded-full bg-[#ead7d2] px-2 py-0.5 text-xs text-[#765d68]">
                  {meals.length}
                </span>
              </DropdownMenu.Item>
            </Dialog.Trigger>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#24121c]/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-3 bottom-3 top-3 z-50 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-[#fffaf6] shadow-[0_30px_100px_-25px_rgba(30,12,21,0.75)] outline-none sm:inset-x-6 sm:bottom-6 sm:top-6">
          <div className="flex items-start justify-between gap-5 border-b border-[#ead7d2] px-5 py-5 sm:px-8 sm:py-6">
            <div>
              <Dialog.Title className="font-serif text-3xl font-semibold tracking-[-0.035em] text-[#321827] sm:text-4xl">
                All meals
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#765d68] sm:text-base">
                Browse all {meals.length} recipes in the dinner rotation.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close all meals"
                className="size-11 shrink-0 rounded-2xl text-[#573344] hover:bg-[#f1e3dc]"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {meals.map((meal) => (
              <article
                key={meal.id}
                className="flex min-h-24 items-center gap-4 rounded-2xl border border-[#ead7d2] bg-white p-3 shadow-sm"
              >
                {/* Images are pre-optimized WebP assets and do not need a server-side image loader. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meal.image}
                  alt=""
                  className="size-20 shrink-0 rounded-xl bg-[#eaded5] object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#a2545f]">
                    {meal.ethnicity}
                  </p>
                  <h2 className="mt-1 text-pretty font-serif text-lg font-semibold leading-tight text-[#321827]">
                    {meal.name}
                  </h2>
                  <p className="mt-1 text-xs text-[#765d68]">{difficultyLabels[meal.difficulty]}</p>
                </div>
              </article>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
