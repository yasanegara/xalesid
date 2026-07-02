import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateOrderCode() {
  return `XLS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantSlug, productSlug, buyerName, buyerEmail, buyerPhone, shippingAddress } = body;

  if (!tenantSlug || !productSlug || !buyerName || !buyerEmail || !buyerPhone) {
    return NextResponse.json({ error: "Data belum lengkap." }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return NextResponse.json({ error: "Toko gak ditemukan." }, { status: 404 });

  const product = await prisma.product.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: productSlug } },
  });
  if (!product) return NextResponse.json({ error: "Produk gak ditemukan." }, { status: 404 });

  if (!tenant.midtransServerKey) {
    return NextResponse.json({ error: "Toko ini belum mengaktifkan pembayaran." }, { status: 400 });
  }
  if (product.isPhysical && !shippingAddress) {
    return NextResponse.json({ error: "Alamat pengiriman wajib diisi." }, { status: 400 });
  }

  const orderCode = generateOrderCode();

  const apiUrl = tenant.midtransIsProd
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const midtransRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Basic " + Buffer.from(tenant.midtransServerKey + ":").toString("base64"),
    },
    body: JSON.stringify({
      transaction_details: { order_id: orderCode, gross_amount: product.price },
      customer_details: { first_name: buyerName, email: buyerEmail, phone: buyerPhone },
      item_details: [{ id: product.id, price: product.price, quantity: 1, name: product.name.slice(0, 50) }],
    }),
  });

  const midtransData = await midtransRes.json();
  if (!midtransData.token) {
    return NextResponse.json({ error: "Gagal menyiapkan pembayaran. Cek lagi kunci Midtrans di Pengaturan Pembayaran." }, { status: 502 });
  }

  await prisma.order.create({
    data: {
      orderCode,
      productId: product.id,
      buyerName,
      buyerEmail,
      buyerPhone,
      shippingAddress: product.isPhysical ? shippingAddress : null,
      paymentStatus: "pending",
    },
  });

  return NextResponse.json({ token: midtransData.token, orderCode });
}
