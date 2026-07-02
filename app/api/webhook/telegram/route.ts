import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const text: string | undefined = update?.message?.text;
  const chatId: string | undefined = update?.message?.chat?.id?.toString();

  if (text && chatId && text.startsWith("/start")) {
    // Format: "/start <tenantId>" — tenantId ini dari link connect yang tenant klik
    const tenantId = text.replace("/start", "").trim();
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant) {
        await prisma.tenant.update({ where: { id: tenant.id }, data: { telegramChatId: chatId } });
        await sendTelegramMessage(chatId, `Toko "${tenant.name}" berhasil terhubung! Kamu bakal dikabarin di sini tiap ada penjualan baru.`);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
