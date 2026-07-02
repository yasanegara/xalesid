import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  return NextResponse.json({
    connected: !!tenant.telegramChatId,
    tenantId: tenant.id,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
  });
}
