import { Prisma } from "../../../src/generated/prisma/client";
import prisma from "../../../src/lib/prisma";
import { mediaUrl } from "@/src/lib/media";
import { AppError } from "../../utils/app-error";
import type { SaveContentInput } from "@/schemas/manage/content.schema";
import { notify, clip } from "../../utils/notify";

/* ───────── SAVE (add + update) ───────── */

export async function saveContent(input: SaveContentInput) {
  const {
    id,
    blocks,
    newChildren,
    homePlacement,
    ...fields
  } = input;

    const before = id
    ? await prisma.contentItem.findUnique({ where: { id }, select: { isActive: true } })
    : null;

  const result = await prisma.$transaction(async (tx) => {
    
    const item = id
      ? await tx.contentItem.update({
          where: { id },
          data: fields,
        })
      : await tx.contentItem.create({
          data: fields as Prisma.ContentItemUncheckedCreateInput,
        });

    // 2. Blocks
    if (blocks) {
      const { updates, removed, order } = blocks;

      // Removed blocks
      if (removed.length) {
        await tx.galleryItem.deleteMany({
          where: {
            contentBlockId: { in: removed },
            contentBlock: {
              contentItemId: item.id,
            },
          },
        });

        await tx.contentBlock.deleteMany({
          where: {
            id: { in: removed },
            contentItemId: item.id,
          },
        });
      }

      const idMap = new Map<string, string>();

      for (const {
        id: blockId,
        type,
        gallery,
        ...data
      } of updates) {
        const block = blockId.startsWith("tmp-")
          ? await tx.contentBlock.create({
              data: {
                ...data,
                type: type!,
                contentItemId: item.id,
              },
            })
          :await tx.contentBlock.update({
              where: {
                id: blockId,
                contentItemId: item.id,
              },
              data,
            });

        idMap.set(blockId, block.id);

        // Gallery
        if (gallery) {
          await tx.galleryItem.deleteMany({
            where: {
              contentBlockId: block.id,
            },
          });

          await tx.galleryItem.createMany({
            data: gallery.map((mediaId, i) => ({
              contentBlockId: block.id,
              mediaId,
              sortOrder: i,
            })),
          });
        }
      }

     
      if (order) {
        for (let i = 0; i < order.length; i++) {
          await tx.contentBlock.update({
            where: {
              id: idMap.get(order[i]) ?? order[i],
            },
            data: {
              sortOrder: i,
            },
          });
        }
      }
    }

   
    if (newChildren?.length) {
      await tx.contentItem.createMany({
        data: newChildren.map((c) => ({
          ...c,
          parentId: item.id,
          isActive: false,
        })),
      });
    }



    if (homePlacement !== undefined) {
    
      await tx.homeSectionItem.deleteMany({
        where: {
          contentItemId: item.id,
        },
      });

     
      if (homePlacement) {
       
        await tx.homeSection.update({
          where: {
            id: homePlacement.homeSectionId,
          },
          data: {
            layout: homePlacement.layout,
            itemVariant: homePlacement.itemVariant,
            mediaRatio: homePlacement.mediaRatio,
          },
        });

        
        await tx.homeSectionItem.create({
          data: {
            homeSectionId: homePlacement.homeSectionId,
            contentItemId: item.id,
            sortOrder: homePlacement.sortOrder ?? 0,
          },
        });
      }
    }

    return {
      id: item.id,
      created: !id,
    };
  }, { timeout: 20_000 });
  await notifyContentSaved(result.id, result.created, before?.isActive ?? false);

  return result;
}

/* ───────── LOAD ───────── */

const sign = async <M extends { fileKey: string }>(
  media: M | null
) =>
  media
    ? {
        ...media,
        url: await mediaUrl(media.fileKey),
      }
    : null;



 
async function getRootRatio(parentId: string | null) {
  let id = parentId;

  for (let depth = 0; id && depth < 20; depth++) {
    const node = await prisma.contentItem.findUnique({
      where: { id },
      select: {
        parentId: true,
        homeSections: {
          take: 1,
          select: { homeSection: { select: { mediaRatio: true } } },
        },
      },
    });
    if (!node) return null;
    if (!node.parentId) return node.homeSections[0]?.homeSection.mediaRatio ?? null;
    id = node.parentId;
  }
  return null;
}
export async function getContentByReference(
  referenceId: string
) {
  const item = await prisma.contentItem.findUnique({
    where: { referenceId },

    include: {
      heroMedia: true,

      parent: {
        select: {
          id: true,
          title: true,
          referenceId: true,
        },
      },

      children: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          title: true,
          referenceId: true,
          isActive: true,
        },
      },

      blocks: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          media: true,

          galleryItems: {
            orderBy: {
              sortOrder: "asc",
            },
            include: {
              media: true,
            },
          },
        },
      },

      homeSections: {
        select: {
          homeSectionId: true,
          sortOrder: true,

          homeSection: {
            select: {
              id: true,
              title: true,
              layout: true,
              itemVariant: true,
              mediaRatio: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    throw new AppError(
      "CONTENT_NOT_FOUND",
      "Content not found",
      404
    );
  }

  return {
    ...item,

    heroMedia: await sign(item.heroMedia),
    heroRatio: await getRootRatio(item.parentId),

    blocks: await Promise.all(
      item.blocks.map(async (block) => ({
        ...block,

        media: await sign(block.media),

        galleryItems: await Promise.all(
          block.galleryItems.map(async (galleryItem) => ({
            ...galleryItem,
            media: await sign(galleryItem.media),
          }))
        ),
      }))
    ),
  };
}

/* ───────── HOME SECTIONS ───────── */

export function getHomeSections() {
  return prisma.homeSection.findMany({
    where: {
      isActive: true,
    },

    orderBy: {
      sortOrder: "asc",
    },

    select: {
      id: true,
      referenceId: true,
      title: true,
      layout: true,
      itemVariant: true,
      mediaRatio: true,
    },
  });
}

/* ───────── DELETE ───────── */

export async function deleteContent(id: string) {
 

  await prisma.contentItem.delete({
    where: { id },
  });
}

const UPDATE_QUIET_MINUTES = 10;

async function notifyContentSaved(id: string, created: boolean, wasActive: boolean) {
  try {
    const item = await prisma.contentItem.findUnique({
      where: { id },
      select: { id: true, title: true, isActive: true },
    });

   
    if (!item?.isActive) return;

    
    if (created || !wasActive) {
      await notify({
        to: "everyone",
        type: "CONTENT_ADDED",
        title: "New content",
        message: `"${clip(item.title)}" has been added. Take a look!`,
        contentItemId: item.id,
      });
      return;
    }

   
    const recent = await prisma.notification.findFirst({
      where: {
        type: "CONTENT_UPDATED",
        contentItemId: id,
        createdAt: { gt: new Date(Date.now() - UPDATE_QUIET_MINUTES * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recent) return;

    await notify({
      to: "everyone",
      type: "CONTENT_UPDATED",
      title: "Content updated",
      message: `"${clip(item.title)}" has been updated.`,
      contentItemId: item.id,
    });
  } catch (error) {
    console.error("[notify] content:", error);
  }
}