import { PrismaClient } from "@prisma/client";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const handleError = (error: unknown) => {
  if (error instanceof Error) {
    return { errorMessage: error.message };
  } else {
    return { errorMessage: "An error occurred" };
  }
}

declare global {
  var Prisma: PrismaClient
}

const Prisma = globalThis.Prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.Prisma = Prisma;

export default Prisma;