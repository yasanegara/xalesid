import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

// Tiap kolom Kanban artinya kombinasi status bayar + status kirim yang beda
const COLUMN_MAP: Record<string, { paymentStatus: string; shippingStatus: string | null }> = {
  leads: { paymentStatus: "belum_bayar", shippingStatus: null },
  pending: { paymentStatus: "pending", shippingStatus: null },
  paid: { paymentStatus: "paid", shippingStatus: "belum_dikirim" },
  shipped: { paymentStatus: "paid", shippingStatus: "dikirim" },
  done: { paymentStatus: "paid", shippingStatus: "selesai" },
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { column } = await req.json();
  const target = COLUMN_MAP[column];
  if (!target) return NextResponse.json({ error: "Kolom gak valid." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { product: true } });
  if (!order || order.product.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Order gak ditemukan." }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: target.paymentStatus,
      // Produk digital gak butuh status kirim, biarin null aja
      shippingStatus: order.product.isPhysical ? target.shippingStatus : null,
    },
  });

  return NextResponse.json(updated);
}
