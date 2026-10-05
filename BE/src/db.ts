import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "./config.js";
import { setTimeout as delay } from "node:timers/promises";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: config.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
  }),
});
export type Database = Prisma.TransactionClient;

// Multi-query reads need one consistent snapshot, not serializable write conflict checks.
export function readSnapshot<T>(work: (db: Database) => Promise<T>): Promise<T> {
  return prisma.$transaction(work, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  });
}

export async function transaction<T>(work: (db: Database) => Promise<T>): Promise<T> {
  // Retry serialization conflicts: check-in/profile/device races remain atomic.
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        attempt >= 3
      )
        throw error;
      await delay(10 * 2 ** attempt + Math.random() * 10);
    }
  }
}
