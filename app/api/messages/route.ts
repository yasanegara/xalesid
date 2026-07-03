import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "Nomor wajib diisi." }, { status: 400 });

  const messages = await prisma.message.findMany({
    where: { tenantId: tenant.id, phone },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { phone, body } = await req.json();
  if (!phone || !body) return NextResponse.json({ error: "Nomor & isi pesan wajib diisi." }, { status: 400 });

  if (tenant.waProvider !== "fonnte" || !tenant.waApiKey) {
    return NextResponse.json(
      { error: "Belum bisa kirim pesan — setting WhatsApp (Fonnte) dulu di Pengaturan." },
      { status: 400 }
    );
  }

  await sendWhatsAppMessage(tenant.waApiKey, phone, body);

  const saved = await prisma.message.create({
    data: { tenantId: tenant.id, phone, direction: "out", body },
  });

  return NextResponse.json(saved);
}
