import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyOrderStatusUpdate } from "@/lib/order-status";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // bukan JSON (misal test ping) — balas OK aja
  }

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, payment_type } = payload;
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return NextResponse.json({ ok: true });
  }

  // Cari server key milik toko yang punya order ini, buat verifikasi tanda tangan
  const order = await prisma.order.findUnique({ where: { orderCode: order_id }, include: { product: { include: { tenant: true } } } });
  if (!order) return NextResponse.json({ ok: true });

  const serverKey = order.product.tenant.midtransServerKey || "";
  const expectedSignature = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + serverKey)
    .digest("hex");

  if (expectedSignature !== signature_key) {
    return NextResponse.json({ error: "Signature gak valid." }, { status: 403 });
  }

  await applyOrderStatusUpdate(order_id, transaction_status, fraud_status, payment_type);

  return NextResponse.json({ ok: true });
}
