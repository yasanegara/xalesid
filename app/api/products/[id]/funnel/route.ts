import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

const STAGES = ["page_view", "cta_click", "checkout_start", "payment_success"] as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Produk gak ditemukan." }, { status: 404 });
  }

  const counts: Record<string, number> = {};
  for (const stage of STAGES) {
    const rows = await prisma.event.findMany({
      where: { productId: product.id, type: stage },
      distinct: ["visitorId"],
      select: { visitorId: true },
    });
    counts[stage] = rows.length;
  }

  return NextResponse.json({ productName: product.name, counts });
}
