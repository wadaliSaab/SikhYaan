import GuruSidebar from "./GuruSidebar";
import GuruHero from "./GuruHero";
import ContentBody from "./ContentBody";
import { groupBlocks } from "@/src/lib/group-blocks";
import type { getContentByReference } from "@/services/content/manager.service";

type Props = { content: Awaited<ReturnType<typeof getContentByReference>> };

export default function ContentReader({ content }: Props) {
  const { tabs, quick, pdfs } = groupBlocks(content.blocks);

  const banner = content.blocks.find(
    (b) => b.type === "IMAGE" && b.title?.trim().toLowerCase() === "banner",
  );
  const heroUrl = banner?.media?.url ?? content.heroMedia?.url;

  return (
    <main className="flex min-h-0 max-w-375 flex-1 gap-5 px-3 py-4 sm:px-5 lg:px-6">
      <GuruSidebar title={content.title} items={content.children} />

      <div className="hide-scrollbar min-w-0 flex-1 space-y-4 overflow-y-auto">
        <GuruHero
          title={content.title}
          summary={content.summary}
          parent={content.parent ?? null}
          heroUrl={heroUrl}
        />
        <ContentBody tabs={tabs} quick={quick} pdfs={pdfs} />
      </div>
    </main>
  );
}