"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import AppText from "@/components/ui/AppText";
import { SECTION_TYPES, typeOf } from "@/src/config/section-types";
import { SUMMARY_MAX, textLength } from "@/src/utils/summary";
import type { HomeItem } from "@/services/content/home.service";

const href = (ref: string) => `/${encodeURIComponent(ref)}`;

const ratioOf = (ratio: string) => ratio.replace(":", " / ");

type Go = (to: string, ref: string) => (e: React.MouseEvent) => void;

const DOUBLE_CLICK_MS = 220;

function useOpenOrCopy() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copied, setCopied] = useState("");

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = (ref: string) => {
    navigator.clipboard
      ?.writeText(ref)
      .then(() => {
        setCopied(ref);
        setTimeout(() => setCopied(""), 1800);
      })
      .catch(() => {});
  };

  const go: Go = (to, ref) => (e) => {
    if (e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    clearTimeout(timer.current);

    if (e.detail > 1) copy(ref);
    else timer.current = setTimeout(() => router.push(to), DOUBLE_CLICK_MS);
  };

  const toast = copied && (
    <div
      role="status"
      className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit rounded-full bg-secondary px-4 py-2 text-sm text-premium shadow-lg"
    >
      Copied: {copied}
    </div>
  );

  return { go, copy, push: router.push, toast };
}

function Img({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed)
    return (
      <div className="grid size-full place-items-center bg-primary/15 text-accent/40">
        <ImageOff size={28} />
      </div>
    );

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`size-full object-cover ${className}`}
    />
  );
}

function Summary({ html, phoneOnly = false }: { html: string; phoneOnly?: boolean }) {
  const long = textLength(html) > SUMMARY_MAX;
  const clip = phoneOnly
    ? "max-sm:max-h-52 max-sm:overflow-hidden max-sm:[mask-image:linear-gradient(black_75%,transparent)]"
    : "max-h-52 overflow-hidden [mask-image:linear-gradient(black_75%,transparent)]";

  return (
    <div
      className={`rich wrap-anywhere text-text-primary ${long ? clip : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const CARDS = {
  PORTRAIT_SMALL: {
   
    width: "w-[7rem] sm:w-28 md:w-36",
    gap: "gap-2",
    pill: "bg-accent-light/80",
    tray: "",
    image: "rounded-md border border-border shadow-xs shadow-shadow/30",
    label: "rounded-sm bg-text-background text-text-primary shadow-2xs shadow-shadow/30",
    fit: "px-1! text-[11px]! leading-tight! tracking-tight text-balance md:text-xs!",
    variant: "small",
  },
  PORTRAIT_LARGE: {
    width: "w-36 sm:w-44 md:w-52",
    gap: "gap-2",
    pill: "bg-accent-light/80",
    tray: "",
    image: "rounded-sm border border-border",
    label: "rounded-sm border-b border-accent text-text-primary shadow-2xs shadow-shadow/30",
    fit: "",
    variant: "meta2",
  },
  LANDSCAPE: {
    width: "w-64 sm:w-72 md:w-80",
    gap: "gap-0",
    pill: "bg-accent/80",
    tray: "",
    image: "shadow-xs shadow-shadow/30",
    label: "border-b border-accent-light/40 bg-text-background font-medium text-accent shadow-2xs shadow-shadow/30",
    fit: "",
    variant: "meta2",
  },
  BOOK_SHELF: {
    width: "w-24 sm:w-28",
    gap: "gap-2",
    pill: "bg-accent/80",
    tray: "rounded-2xl border-b border-border/40 bg-text-background/20 py-4",
    image: "rounded-sm border border-border",
    label: "text-text-primary",
    fit: "",
    variant: "small",
  },
} as const;

type CardType = keyof typeof CARDS;

function Cards({ item, type, go, copy }: { item: HomeItem; type: CardType; go: Go; copy: (ref: string) => void }) {
  if (!item.children.length) return null;

  const style = CARDS[type];
  const ratio = ratioOf(SECTION_TYPES[type].ratio);

  return (
    <section className="flex w-full min-w-0 flex-col items-center gap-5">
      <div
        onDoubleClick={() => copy(item.referenceId)}
        className={`max-w-full cursor-default select-none rounded-sm px-8 py-1 shadow-md shadow-shadow/30 sm:px-14 ${style.pill}`}
      >
        <AppText as="h2" variant="title" className="truncate text-background">
          {item.title}
        </AppText>
      </div>

      <div className={`hide-scrollbar flex w-full snap-x snap-proximity overflow-x-auto scroll-px-4 ${style.tray}`}>
        <div className="mx-auto flex gap-3 px-4 sm:gap-4">
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={href(child.referenceId)}
              title={child.title}
              onClick={go(href(child.referenceId), child.referenceId)}
              className={`group flex shrink-0 select-none snap-start flex-col items-center ${style.gap} ${style.width}`}
            >
              <div
                className={`w-full overflow-hidden bg-primary/15 ${style.image}`}
                style={{ aspectRatio: ratio }}
              >
                <Img
                  src={child.imageUrl}
                  alt={child.title}
                  className="transition duration-300 group-hover:scale-105"
                />
              </div>

              <AppText
                as="h3"
                variant={style.variant}
                className={`line-clamp-2 w-full px-2 py-1 text-center wrap-anywhere ${style.label} ${style.fit}`}
              >
                {child.title}
              </AppText>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Article({ item, go }: { item: HomeItem; go: Go }) {
  return (
    <Link
      href={href(item.referenceId)}
      onClick={go(href(item.referenceId), item.referenceId)}
      className="parchment relative flex w-full max-w-sm select-none items-center justify-center bg-contain bg-center bg-no-repeat text-center drop-shadow-lg drop-shadow-shadow sm:max-w-md md:max-w-xl"
    >
      <AppText as="h2" variant="subHeading" className="relative z-10 mx-10 py-3 text-text-primary">
        {item.title}
      </AppText>
    </Link>
  );
}

function Notice({ item, go, push }: { item: HomeItem; go: Go; push: (to: string) => void }) {
  if (!item.summary) return null;

  const to = href(item.referenceId);
  const open = go(to, item.referenceId);

  return (
    <section
      role="link"
      tabIndex={0}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("a")) open(e);
      }}
      onKeyDown={(e) => e.key === "Enter" && push(to)}
      className="w-full max-w-4xl cursor-pointer select-none rounded-xl bg-text-background/20 px-4 py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-8"
    >
      <div className="mx-auto mb-4 w-fit max-w-full rounded-sm border-b-2 bg-text-background/40 px-8 py-2 sm:px-16">
        <AppText as="h2" variant="subtitle" className="truncate text-center font-bold uppercase text-accent">
          {item.title}
        </AppText>
      </div>

      <Summary html={item.summary} />
    </section>
  );
}

function Feature({ item, go }: { item: HomeItem; go: Go }) {
  const ratio = ratioOf(SECTION_TYPES.FEATURE.ratio);
  const to = href(item.referenceId);
  const open = go(to, item.referenceId);

  return (
    <section className="w-full max-w-4xl">
      <article className="anchient-border flex flex-col overflow-hidden bg-accent-light sm:flex-row">
        <Link
          href={to}
          title={item.title}
          onClick={open}
          className="relative block max-h-64 select-none overflow-hidden bg-primary/20 sm:max-h-96 sm:w-[58%] sm:shrink-0"
          style={{ aspectRatio: ratio }}
        >
          <Img src={item.imageUrl} alt={item.title} className="antique-image" />
          <div className="image-fade pointer-events-none absolute inset-y-0 right-0 hidden w-[16%] sm:block" />
        </Link>

        <div className="relative flex-1">
          <div className="flex flex-col gap-3 px-5 py-5 text-left sm:absolute sm:inset-0 sm:py-3 sm:text-center ">
            {/* Title */}
            <AppText
              as="h2"
              variant="subHeading"
              className="font-roboto-serif underline-offset-2 underline text-accent wrap-anywhere sm:shrink-0"
            >
              {item.title}
            </AppText>

           
            <div className="hide-scrollbar flex flex-col gap-3 sm:block sm:min-h-0 sm:flex-1 sm:overflow-y-auto">
              {item.summary && <Summary html={item.summary} phoneOnly />}

              <Link
                href={to}
                onClick={open}
                className="inline-block self-start text-sm font-semibold text-accent underline underline-offset-4 sm:mt-3"
              >
                Read more
              </Link>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

export default function HomeSection({ item }: { item: HomeItem }) {
  const { go, copy, push, toast } = useOpenOrCopy();
  const type = typeOf(item);

  return (
    <>
      {type === "ARTICLE" && <Article item={item} go={go} />}
      {type === "NOTICE" && <Notice item={item} go={go} push={push} />}
      {type === "FEATURE" && <Feature item={item} go={go} />}
      {(type === "PORTRAIT_SMALL" ||
        type === "PORTRAIT_LARGE" ||
        type === "LANDSCAPE" ||
        type === "BOOK_SHELF") && <Cards item={item} type={type} go={go} copy={copy} />}
      {toast}
    </>
  );
}