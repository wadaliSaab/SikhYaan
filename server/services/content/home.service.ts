import prisma from "@/src/lib/prisma";
import { mediaUrl } from "@/src/lib/media";
const heroOnly = { select: { fileKey: true } } as const;

const imageUrl = (media: { fileKey: string } | null) =>
  media ? mediaUrl(media.fileKey) : Promise.resolve(null);


export async function getHomeItems() {
  const rows = await prisma.homeSectionItem.findMany({
    where: { homeSection: { isActive: true }, contentItem: { isActive: true } },
    orderBy: [{ sortOrder: "asc" }, { contentItem: { createdAt: "asc" } }],
    select: {
      homeSection: { select: { layout: true, itemVariant: true, mediaRatio: true } },
      contentItem: {
        select: {
          id: true,
          referenceId: true,
          title: true,
          summary: true,
          heroMedia: heroOnly,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: { id: true, referenceId: true, title: true, heroMedia: heroOnly },
          },
        },
      },
    },
  });

  return Promise.all(
    rows.map(async ({ homeSection, contentItem: c }) => ({
      id: c.id,
      referenceId: c.referenceId,
      title: c.title,
      summary: c.summary,
      imageUrl: await imageUrl(c.heroMedia),
      ...homeSection,
      children: await Promise.all(
        c.children.map(async (child) => ({
          id: child.id,
          referenceId: child.referenceId,
          title: child.title,
          imageUrl: await imageUrl(child.heroMedia),
        })),
      ),
    })),
  );
}