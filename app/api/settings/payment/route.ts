import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { midtransServerKey, midtransClientKey, midtransIsProd } = await req.json();

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      // Server key cuma diupdate kalau diisi ulang — biar gak ketimpa kosong tanpa sengaja
      ...(midtransServerKey ? { midtransServerKey } : {}),
      midtransClientKey: midtransClientKey || null,
      midtransIsProd: !!midtransIsProd,
    },
  });

  return NextResponse.json({ ok: true });
}
