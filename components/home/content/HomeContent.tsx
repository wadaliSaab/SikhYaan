"use client";

import { Fragment, useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import { getHome, type HomeItem } from "@/services/content/home.service";
import HomeSection from "./HomeSection";
import TopGurus from "./TopGurus";
import HomeFooter from "./HomeFooter";

const Divider = () => <div className="w-full max-w-2xl border-b border-border/70" />;


function Skeleton() {
  const bar = "animate-pulse rounded-md bg-primary/20";

  return (
    <div aria-busy="true" aria-label="Loading" className="flex w-full flex-col items-center gap-10 sm:gap-14">
      {[0, 1].map((i) => (
        <div key={i} className="flex w-full flex-col items-center gap-5">
          <div className={`${bar} h-8 w-48 sm:w-64`} />
          <div className="flex w-full justify-center gap-4 overflow-hidden">
            {[0, 1, 2, 3, 4].map((j) => (
              <div key={j} className={`${bar} aspect-3/4 w-24 shrink-0 sm:w-28 md:w-32`} />
            ))}
          </div>
        </div>
      ))}
      <div className={`${bar} aspect-video w-full max-w-4xl`} />
    </div>
  );
}

export default function HomeContent() {
  const [items, setItems] = useState<HomeItem[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    getHome()
      .then((data) => !ignore && setItems(data))
      .catch((e) => !ignore && setError(e instanceof Error ? e.message : "Home load nahi hoya"));

    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setError("");
    setItems(null);
    setAttempt((n) => n + 1);
  };

  return (
    <div className="hide-scrollbar flex w-full min-w-0 flex-1 flex-col overflow-y-auto">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-10 px-4 py-8 sm:gap-14 sm:px-6 md:py-10">
        <TopGurus />

        {error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AppText variant="body" className="text-text-primary/70">{error}</AppText>
            <AppButton variant="outline" onClick={retry} className="rounded-full px-5 py-2 text-sm">
              Try again
            </AppButton>
          </div>
        ) : items === null ? (
          <>
            
            <Skeleton />
          </>
        ) : items.length === 0 ? (
          <AppText variant="body" className="py-12 text-text-primary/60">
            Content is coming soon.
          </AppText>
        ) : (
          items.map((item) => (
            <Fragment key={item.id}>
              
              <HomeSection item={item} />
            </Fragment>
          ))
        )}
      </main>

      <HomeFooter />
    </div>
  );
}