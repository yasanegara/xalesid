import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function POST() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  await prisma.tenant.update({ where: { id: tenant.id }, data: { telegramChatId: null } });
  return NextResponse.json({ ok: true });
}
