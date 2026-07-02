import { PrismaClient } from "@prisma/client";

// Trik biar pas development (hot reload) gak bikin koneksi database baru terus-terusan
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
