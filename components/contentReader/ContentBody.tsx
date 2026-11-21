"use client";
import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import GalleryGrid from "./GalleryGrid";
import GuruAside from "./GuruAside";
import type { Tab } from "@/src/lib/group-blocks";
import type { ContentBlock } from "@/services/content/manager.service";

type Props = { tabs: Tab[]; quick: ContentBlock[]; pdfs: ContentBlock[] };

const wrap = "[overflow-wrap:anywhere]";
const MORE_AFTER = 500; 


const textLength = (html: string) => html.replace(/<[^>]*>/g, "").length;

function RichText({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = textLength(html) > MORE_AFTER;
  const clipped = long && !expanded;

  return (
    <div className="min-w-0">
      <div className="relative">
        <div
          className={`rich min-w-0 max-w-full text-sm sm:text-base ${wrap} ${
            clipped ? "max-h-48 overflow-hidden" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {clipped && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-text-background to-transparent" />
        )}
      </div>

      {long && (
        <AppButton
          variant="icon"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm text-primary"
        >
          {expanded ? "Less" : "More"}
        </AppButton>
      )}
    </div>
  );
}

export default function ContentBody({ tabs, quick, pdfs }: Props) {
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 rounded-xl bg-text-background p-4 sm:p-6">
        {!tab ? (
          <AppText variant="body" className="font-normal">No content yet</AppText>
        ) : (
          <>
            <div className="hide-scrollbar mb-4 flex overflow-x-auto border-b border-border/20">
              {tabs.map((t) => (
                <AppButton
                  key={t.key}
                  variant="icon"
                  onClick={() => setActive(t.key)}
                  className={`max-w-56 shrink-0 border-b-2 px-4 py-3 ${
                    t.key === tab.key ? "border-primary text-primary" : "border-transparent"
                  }`}
                >
                  <AppText variant="body" as="span" className="block truncate text-inherit">
                    {t.label}
                  </AppText>
                </AppButton>
              ))}
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              {tab.texts.map((b) => (
                <RichText key={b.id} html={b.content ?? ""} />
              ))}

              {tab.mainGalleries.map((urls, i) => (
                <GalleryGrid key={i} urls={urls} />
              ))}
            </div>
          </>
        )}
      </section>

      <GuruAside quick={quick} galleries={tab?.asideGalleries ?? []} pdfs={pdfs} />
    </div>
  );
}