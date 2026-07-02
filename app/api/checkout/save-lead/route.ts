import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateOrderCode() {
  return `LEAD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { tenantSlug, productSlug, visitorId, buyerName, buyerEmail, buyerPhone, shippingAddress } = await req.json();
    if (!tenantSlug || !productSlug || !visitorId || !buyerName || !buyerPhone) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return NextResponse.json({ ok: false }, { status: 404 });

    const product = await prisma.product.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: productSlug } },
    });
    if (!product) return NextResponse.json({ ok: false }, { status: 404 });

    // Cek udah pernah nyimpen draft dari pengunjung yang sama buat produk ini apa belum
    const existing = await prisma.order.findFirst({
      where: { visitorId, productId: product.id, paymentStatus: "belum_bayar" },
    });

    if (existing) {
      await prisma.order.update({
        where: { id: existing.id },
        data: { buyerName, buyerEmail: buyerEmail || "", buyerPhone, shippingAddress: shippingAddress || null },
      });
    } else {
      await prisma.order.create({
        data: {
          orderCode: generateOrderCode(),
          productId: product.id,
          buyerName,
          buyerEmail: buyerEmail || "",
          buyerPhone,
          shippingAddress: shippingAddress || null,
          paymentStatus: "belum_bayar",
          visitorId,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Ini fitur "diam-diam", gagal kesimpen gak boleh ganggu pembeli
    return NextResponse.json({ ok: false });
  }
}
