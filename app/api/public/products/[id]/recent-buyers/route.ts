import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function abbreviate(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || !product.socialProofEnabled) {
    return NextResponse.json([]);
  }

  const orders = await prisma.order.findMany({
    where: { productId: product.id, paymentStatus: "paid" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { buyerName: true, createdAt: true },
  });

  const result = orders.map((o) => ({
    name: abbreviate(o.buyerName),
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}
