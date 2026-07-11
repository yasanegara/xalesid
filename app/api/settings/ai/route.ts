import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

const ALLOWED = ["anthropic", "openai", "sumopod", "none"];

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { aiProvider, aiApiKey, aiModel } = await req.json();
  if (!ALLOWED.includes(aiProvider)) {
    return NextResponse.json({ error: "Pilihan AI gak valid." }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      aiProvider,
      aiApiKey: aiApiKey ? aiApiKey : null,
      aiModel: aiModel || null,
    },
  });

  return NextResponse.json({ ok: true });
}
