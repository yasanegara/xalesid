import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const body = await req.json();
  const { name, description, price, isPhysical, digitalFileUrl } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "Nama produk dan harga wajib diisi." }, { status: 400 });
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: "Harga harus angka lebih dari 0." }, { status: 400 });
  }
  if (!isPhysical && !digitalFileUrl) {
    return NextResponse.json({ error: "Produk digital wajib punya link file." }, { status: 400 });
  }

  // Slug unik per toko (bukan unik global, jadi 2 toko boleh punya slug produk yang sama)
  let slug = toSlug(name);
  let suffix = 0;
  while (
    await prisma.product.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: suffix ? `${slug}-${suffix}` : slug } },
    })
  ) {
    suffix += 1;
  }
  if (suffix) slug = `${slug}-${suffix}`;

  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name,
      slug,
      description: description || null,
      price: priceNum,
      isPhysical: !!isPhysical,
      digitalFileUrl: isPhysical ? null : digitalFileUrl,
    },
  });

  return NextResponse.json(product);
}
