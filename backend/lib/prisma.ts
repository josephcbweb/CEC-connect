import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
// Explicitly type prisma or cast to any to avoid TSError if types are stale
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient; // Force type recog

export { prisma };
