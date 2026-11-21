"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AppText from "@/components/ui/AppText";


type Props = {
  title: string;
  summary: string | null;
  parent: { title: string; referenceId: string } | null;
  heroUrl?: string;
};

export default function GuruHero({ title, summary, parent, heroUrl }: Props) {

  const [wide, setWide] = useState<boolean | null>(null);

  useEffect(() => {
    setWide(null);
    if (!heroUrl) return;
    const img = new window.Image();
    img.onload = () => setWide(img.naturalWidth > img.naturalHeight * 1.15);
    img.src = heroUrl;
  }, [heroUrl]);

  const side = wide === false;

  return (
    <section
      className={`flex flex-col gap-4 rounded-xl bg-text-background p-3 sm:p-6 ${
        side ? "sm:flex-row sm:items-center sm:gap-6" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-1 text-text-secondary">
          <Link href="/"><AppText variant="meta2" as="span">Home</AppText></Link>
          {parent && (
            <>
              <ChevronRight size={10} />
              <Link href={`/${parent.referenceId}`}>
                <AppText variant="meta2" as="span">{parent.title}</AppText>
              </Link>
            </>
          )}
        </div>

        <AppText
          variant="heading"
          as="h1"
          className="font-roboto-serif text-2xl leading-tight text-accent wrap-anywhere sm:text-4xl lg:text-5xl"
        >
          {title}
        </AppText>

        {summary && (
          <div
            className="rich mt-3 max-w-full text-sm wrap-anywhere sm:text-lg"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        )}
      </div>

      {heroUrl && wide !== null && (
        <img
          src={heroUrl}
          alt={title}
          className={`mx-auto h-auto w-auto max-w-full rounded-xl object-contain shadow-md ${
            side
              ? "max-h-72 shrink-0 sm:max-w-72 lg:max-w-80"
              : "max-h-80 sm:max-h-96"
          }`}
        />
      )}
    </section>
  );
}