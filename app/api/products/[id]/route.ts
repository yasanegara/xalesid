import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Produk gak ditemukan." }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Produk gak ditemukan." }, { status: 404 });
  }

  const {
    name,
    description,
    price,
    isPhysical,
    digitalFileUrl,
    benefitPoints,
    photoUrl,
    guaranteeText,
    faqJson,
    aiHeadline,
    landingBlocksJson,
    brandColor,
    brandFont,
    stylePreset,
    referenceUrl,
    referenceImageUrl,
    stockEnabled,
    stockQty,
    showSoldCount,
    showViewingNow,
    promoPrice,
    promoEndsAt,
    socialProofEnabled,
  } = await req.json();

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
  if (stockEnabled && (stockQty === undefined || stockQty === null || Number(stockQty) < 0)) {
    return NextResponse.json({ error: "Isi jumlah stok yang valid." }, { status: 400 });
  }
  if (promoPrice && Number(promoPrice) >= priceNum) {
    return NextResponse.json({ error: "Harga promo harus lebih murah dari harga normal." }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name,
      description: description || null,
      price: priceNum,
      isPhysical: !!isPhysical,
      digitalFileUrl: isPhysical ? null : digitalFileUrl,
      benefitPoints: benefitPoints || null,
      photoUrl: photoUrl || null,
      guaranteeText: guaranteeText || null,
      faqJson: faqJson || null,
      aiHeadline: aiHeadline || null,
      landingBlocksJson: landingBlocksJson || null,
      brandColor: brandColor || null,
      brandFont: brandFont || null,
      stylePreset: stylePreset || "bold",
      referenceUrl: referenceUrl || null,
      referenceImageUrl: referenceImageUrl || null,
      stockEnabled: !!stockEnabled,
      stockQty: stockEnabled ? Number(stockQty) : null,
      showSoldCount: !!showSoldCount,
      showViewingNow: !!showViewingNow,
      promoPrice: promoPrice ? Number(promoPrice) : null,
      promoEndsAt: promoEndsAt ? new Date(promoEndsAt) : null,
      socialProofEnabled: !!socialProofEnabled,
    },
  });

  return NextResponse.json(product);
}
