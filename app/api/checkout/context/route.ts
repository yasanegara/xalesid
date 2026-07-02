import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenant");
  const productSlug = searchParams.get("product");

  if (!tenantSlug || !productSlug) {
    return NextResponse.json({ error: "Parameter gak lengkap." }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return NextResponse.json({ error: "Toko gak ditemukan." }, { status: 404 });

  const product = await prisma.product.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: productSlug } },
  });
  if (!product) return NextResponse.json({ error: "Produk gak ditemukan." }, { status: 404 });

  return NextResponse.json({
    product: {
      name: product.name,
      price: product.price,
      isPhysical: product.isPhysical,
    },
    paymentReady: !!tenant.midtransServerKey && !!tenant.midtransClientKey,
    midtransClientKey: tenant.midtransClientKey || "",
    midtransIsProd: tenant.midtransIsProd,
  });
}
