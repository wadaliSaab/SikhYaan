import crypto from "crypto";
import prisma from "../../../src/lib/prisma";
import { AppError } from "../../utils/app-error";

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; 


function initials(title: string) {
  const words = title.match(/[A-Za-z0-9]+/g) ?? [];
  if (words.length === 0) return "ITEM";
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 5).toUpperCase();
}


// hash

function hash(text: string) {
  const bytes = crypto.createHash("sha256").update(text).digest();
  return Array.from(bytes.subarray(0, 4), (b) => CHARS[b % CHARS.length]).join("");
}



// main

export async function generateReferenceId(input: { title: string; parentId?: string; id?: string }) {
  const base = input.title.toLowerCase();


  for (let salt = 0; salt < 20; salt++) {
    const referenceId = `${initials(input.title)}-${hash(`${base}|${input.parentId ?? ""}|${salt}`)}`;

    const found = await prisma.contentItem.findUnique({
      where: { referenceId },
      select: { id: true },
    });

    if (!found || found.id === input.id) return referenceId;
  }

  throw new AppError("REFERENCE_ID_FAILED", "Could not generate reference ID", 500);
}