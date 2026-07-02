import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Dipakai di halaman & API buat tahu "ini toko siapa yang lagi login"
export async function getCurrentTenant() {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  return prisma.tenant.findUnique({ where: { id: session.tenantId } });
}
