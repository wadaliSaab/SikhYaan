
"use client";

import {
  ArrowRight,
  BookOpen,
  Feather,
  FilePlus2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";

type GyaanTestHeroProps = {
  canCreateTest?: boolean;
  isLoggedIn?: boolean;
  onExploreTests: () => void;
  onCreateTest?: () => void;
};

export default function GyaanTestHero({
  canCreateTest = false,
  isLoggedIn = false,
  onExploreTests,
  onCreateTest,
}: GyaanTestHeroProps) {
  return (
    <section className="relative isolate min-h-40 overflow-hidden rounded-2xl border border-primary/25 bg-linear-to-r from-[#F3E8CF] to-[#E9D9AE]">
     

      <div className="grid items-center gap-2 p-5 sm:p-6 md:grid-cols-[1fr_auto] ">
        <div className="max-w-2xl">

          {/* starting note */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/40 px-3 py-1.5">
            <Sparkles
              size={15}
              aria-hidden="true"
              className="text-accent-light"
            />

            <AppText variant="caption" className="text-accent">
              LEARN · PRACTISE · IMPROVE
            </AppText>
          </div>


          <AppText
            as="h1"
            variant="heading"
            className="sm:text-2xl leading-tight tracking-tight text-accent "
          >
            Put your knowledge
            <span className="block text-accent-light">
              to the test.
            </span>
          </AppText>

          <AppText
            variant="body"
            className="mt-4 max-w-xl text-xs leading-7 text-text-primary/80 sm:text-sm"
          >
            Discover practice tests, challenge yourself, and track your
            progress — one test at a time.
          </AppText>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <AppButton
              type="button"
              variant="primary"
              onClick={onExploreTests}
              className="inline-flex  text-2xs items-center gap-2 rounded-full px-4 py-2 font-semibold"
            >
              Explore tests
              <ArrowRight size={17} aria-hidden="true" />
            </AppButton>

            {canCreateTest && (
              <AppButton
                type="button"
                variant="outline"
                onClick={onCreateTest}
                className="inline-flex  items-center gap-2 rounded-full border-primary/30 bg-white/70 px-4 py-2 text-xs font-semibold"
              >
                <FilePlus2 size={16} aria-hidden="true" />
                Create a test
              </AppButton>
            )}
          </div>

          {!isLoggedIn && (
            <AppText
              variant="caption"
              className="mt-4 flex items-center gap-1.5 text-text-primary/70"
            >
              <LockKeyhole size={13} aria-hidden="true" />
              Browse available tests as a guest.
            </AppText>
          )}
        </div>

        {/* Decorative illustration */}
        <div
          aria-hidden="true"
          className="hidden shrink-0 items-end gap-3 pr-2 md:flex lg:pr-5"
        >
          <div className="flex flex-col gap-1.5 pb-1">
            <div className="h-2.5 w-10 rounded-full bg-primary/35 lg:w-14" />
            <div className="h-2.5 w-14 rounded-full bg-primary/50 lg:w-16" />
            <div className="h-2.5 w-8 rounded-full bg-primary/65 lg:w-11" />
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-sm lg:p-5">
            <BookOpen
              size={20}
              strokeWidth={1.6}
              className="text-accent lg:size-6"
            />
          </div>

          <Feather
            size={25}
            strokeWidth={1.5}
            className="-rotate-12 text-accent-light"
          />
        </div>
      </div>
    </section>
  );
}
