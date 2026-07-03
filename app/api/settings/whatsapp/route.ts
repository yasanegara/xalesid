import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { waProvider, waApiKey, waNotifyNumber } = await req.json();

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      waProvider: waProvider === "fonnte" ? "fonnte" : "none",
      ...(waApiKey ? { waApiKey } : {}),
      waNotifyNumber: waNotifyNumber ? waNotifyNumber.replace(/[^0-9]/g, "") : null,
    },
  });

  return NextResponse.json({ ok: true });
}
