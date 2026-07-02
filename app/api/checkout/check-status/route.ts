import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyOrderStatusUpdate } from "@/lib/order-status";

export async function POST(req: NextRequest) {
  const { orderCode } = await req.json();
  if (!orderCode) return NextResponse.json({ error: "orderCode wajib diisi." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { orderCode }, include: { product: { include: { tenant: true } } } });
  if (!order) return NextResponse.json({ error: "Order gak ditemukan." }, { status: 404 });

  const tenant = order.product.tenant;
  const apiUrl =
    (tenant.midtransIsProd ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com") + `/v2/${orderCode}/status`;

  const res = await fetch(apiUrl, {
    headers: { authorization: "Basic " + Buffer.from((tenant.midtransServerKey || "") + ":").toString("base64") },
  });
  const data = await res.json();

  if (!data.transaction_status) {
    return NextResponse.json({ paid: false, pending: true });
  }

  const updated = await applyOrderStatusUpdate(orderCode, data.transaction_status, data.fraud_status, data.payment_type);

  return NextResponse.json({
    paid: updated?.paymentStatus === "paid",
    pending: updated?.paymentStatus === "pending",
    isPhysical: order.product.isPhysical,
    digitalFileUrl: updated?.paymentStatus === "paid" && !order.product.isPhysical ? order.product.digitalFileUrl : null,
  });
}
