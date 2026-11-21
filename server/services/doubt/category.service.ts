
import prisma from "@/src/lib/prisma";
import { AppError } from "@/server/utils/app-error";
import { Prisma } from "@/src/generated/prisma/client";
import type { CreateDoubtCategoryInput } from "@/schemas/doubt/category.schema";



function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function createSlug(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}





export async function getDoubtCategories() {
  return prisma.doubtCategory.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          doubts: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
  });
}




// create doubt category
export async function createDoubtCategory(
  input: CreateDoubtCategoryInput
) {
  const name = normalizeName(input.name);

  if (name.length < 2 || name.length > 50) {
    throw new AppError(
      "INVALID_CATEGORY_NAME",
      "Category name must be between 2 and 50 characters",
      400
    );
  }

  const slug = createSlug(name);

  if (!slug) {
    throw new AppError(
      "INVALID_CATEGORY_NAME",
      "Enter a valid category name",
      400
    );
  }

  const existingCategory = await prisma.doubtCategory.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existingCategory) {
    throw new AppError(
      "CATEGORY_ALREADY_EXISTS",
      "This category already exists",
      409
    );
  }

  const existingSlug = await prisma.doubtCategory.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (existingSlug) {
    throw new AppError(
      "CATEGORY_SLUG_ALREADY_EXISTS",
      "A category with this slug already exists",
      409
    );
  }

  try {
    return await prisma.doubtCategory.create({
      data: {
        name,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "CATEGORY_ALREADY_EXISTS",
        "A category with this name or slug already exists",
        409
      );
    }

    throw error;
  }
}
