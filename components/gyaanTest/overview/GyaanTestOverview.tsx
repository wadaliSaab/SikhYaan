"use client";

import { useEffect, useState ,useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, LockKeyhole } from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";
import TestCard, { type GyaanTest } from "./TestCard";
import GyaanTestHero from "./GyaanTestHero";

import {
  listTests,
  listMyAttempts,
  startAttempt,
  type Test,
  type AttemptSummary,
} from "@/services/gyaan/test.service";

type TestTab = "all" | "my" | "given";
type ViewMode = "guest" | "user";

type GyaanTestOverviewProps = {

  viewMode?: ViewMode;
  canCreateTest?: boolean;
};

const LEVEL = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
} as const;

const fromTest = (t: Test): GyaanTest => ({
  id: t.id,
  title: t.title,
  description: t.description,
  category: t.category,
  questions: t.questionCount,
  durationMinutes: t.durationMinutes,
  difficulty: LEVEL[t.difficulty],
});

const fromAttempt = (a: AttemptSummary): GyaanTest => ({
  id: a.id,
  title: a.title,
  description: "",
  category: a.category,
  questions: a.questionCount,
  durationMinutes: a.durationMinutes,
  difficulty: LEVEL[a.difficulty],
  score: a.percentage,
  correctAnswers: a.correctAnswers,
  wrongAnswers: a.wrongAnswers,
  timeTakenMinutes: Math.round(a.timeTakenSeconds / 60),
});

const tabs: { id: TestTab; label: string }[] = [
  { id: "all", label: "All Tests" },
  { id: "my", label: "My Tests" },
  { id: "given", label: "Given Tests" },
];

export default function GyaanTestOverview({
  viewMode = "guest",
  canCreateTest = false,
}: GyaanTestOverviewProps) {
  const [activeTab, setActiveTab] = useState<TestTab>("all");
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const [tests, setTests] = useState<GyaanTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const handled = useRef(false);

  const isLoggedIn = viewMode === "user";

  useEffect(() => {
    if (!isLoggedIn && activeTab !== "all") return; 

    let ignore = false;
        setLoaded(false);
    setLoading(true);
    
    setError("");
    setTests([]);

    const request =
      activeTab === "given"
        ? listMyAttempts().then((r) => r.items.map(fromAttempt))
        : listTests(activeTab === "my" ? { mine: true } : {}).then((r) =>
            r.items.map(fromTest),
          );

    request
      .then((items) => !ignore && setTests(items))
      .catch(
        (e) =>
          !ignore &&
          setError(e instanceof Error ? e.message : "Tests load nahi hoye"),
      )
            .finally(() => {
        if (!ignore) {
          setLoading(false);
          setLoaded(true);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, isLoggedIn]);

  useEffect(() => {
    setFocusId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  
  useEffect(() => {
    if (!focusId || !loaded || error || activeTab !== "all" || handled.current) return;
    handled.current = true;

    if (!tests.some((t) => t.id === focusId)) {
      setNotFound(true);
      return;
    }

    setHighlightId(focusId);
    document.getElementById(`test-${focusId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
    setTimeout(() => setHighlightId(null), 3000);
  }, [focusId, loaded, error, tests, activeTab]);

  const handleTestAction = async (test: GyaanTest) => {
    setActionError("");
    if (activeTab === "my") {
  router.push(`/gyaan/test/update/${test.id}`);
  return;
}
if (activeTab === "given") {
  router.push(`/gyaan/attempt/${test.id}`); 
  return;
}

    if (activeTab !== "all") return; 

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    try {
      const { attemptId } = await startAttempt(test.id);
      router.push(`/gyaan/attempt/${attemptId}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Test shuru nahi hoya");
    }
  };

  return (
    <main className="min-h-screen   p-4">
      <div className="mx-auto w-full max-w-7xl space-y-7 sm:space-y-9">
        {/* HeroSection */}
        <GyaanTestHero
          canCreateTest={canCreateTest}
          isLoggedIn={isLoggedIn}
          onExploreTests={() => {
            setActiveTab("all");
            document.getElementById("test-collections")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          onCreateTest={() => {
            router.push("/gyaan/test/create");
          }}
        />

        {/* Collections */}
        <section id="test-collections" className="scroll-mt-6 sm:px-6 px-2 space-y-5">
          {/* Heading */}
          <div>
            <AppText
              as="h2"
              variant="heading"
              className="text-2xl text-accent "
            >
              Test collections
            </AppText>
            <AppText variant="body" className="mt-2 text-text-primary/65">
              Find a test, manage your own, or review completed attempts.
            </AppText>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border/60">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const locked = !isLoggedIn && tab.id !== "all";

              return (
                <AppButton
                  key={tab.id}
                  type="button"
                  variant="filterMob"
                  active={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-none px-4 text-sm ${
                    active
                      ? "border-b-2 border-primary text-accent"
                      : "text-text-primary/65 hover:text-accent"
                  }`}
                >
                  {tab.label}
                  {locked && <LockKeyhole size={13} />}
                </AppButton>
              );
            })}
          </div>
          {actionError && (
            <AppText variant="caption" className="text-error">
              {actionError}
            </AppText>
          )}
                    {notFound && (
            <AppText variant="caption" className="text-text-secondary">
              This test is no longer available.
            </AppText>
          )}

       
          {!isLoggedIn && activeTab !== "all" ? (
            <div className="flex flex-col items-center rounded-2xl  px-5 py-12 text-center sm:py-16">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/7 text-accent">
                <LockKeyhole size={25} />
              </div>

              <AppText
                as="h3"
                variant="title"
                className="mt-4 text-lg text-accent"
              >
                Sign in to access{" "}
                {activeTab === "my" ? "your tests" : "test history"}
              </AppText>

              <AppText
                variant="body"
                className="mt-2 max-w-md leading-6 text-text-primary/65"
              >
                You can browse available tests as a guest. Sign in to view your
                own tests and completed attempts.
              </AppText>

              <AppButton
                type="button"
                variant="primary"
                onClick={() => {
               
                }}
                className="mt-5 min-h-11 rounded-full px-6 font-semibold"
              >
                Sign in
                <ArrowRight size={16} className="ml-2 inline" />
              </AppButton>
            </div>
          ) : loading ? (
            <AppText
              variant="body"
              className="py-10 text-center text-text-primary/65"
            >
              Loading…
            </AppText>
          ) : error ? (
            <AppText variant="body" className="py-10 text-center text-error">
              {error}
            </AppText>
          ) : tests.length > 0 ? (
            <>
              <div className="flex items-center justify-between ">
                <AppText variant="caption" className="text-text-primary/60">
                  {activeTab === "all"
                    ? "AVAILABLE FOR PRACTICE"
                    : activeTab === "my"
                      ? "CREATED BY YOU"
                      : "YOUR COMPLETED ATTEMPTS"}
                </AppText>

                <AppText
                  variant="caption"
                  className="rounded-full bg-premium px-3 py-1.5 text-text-primary/70"
                >
                  {tests.length} {tests.length === 1 ? "test" : "tests"}
                </AppText>
              </div>

              <div className="sm:grid  flex overflow-x-auto  hide-scrollbar  gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {tests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                                        highlighted={test.id === highlightId}
                    showResult={activeTab === "given"}
                    actionLabel={
                      activeTab === "given"
                        ? "View result"
                        : activeTab === "my"
                          ? "View test"
                          : "Start test"
                    }
                    onAction={handleTestAction}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl p-4 border border-dashed border-border bg-text-background px-5 py-12 text-center">
              <BookOpenCheck
                size={30}
                className="mx-auto text-text-secondary"
              />
              <AppText as="h3" variant="title" className="mt-3 text-accent">
                Nothing here yet
              </AppText>
              <AppText variant="body" className="mt-2 text-text-primary/65">
                Your tests will appear here when they are available.
              </AppText>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
