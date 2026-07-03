import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const sender: string | undefined = data.sender;
  const text: string | undefined = data.message || data.text;
  if (!sender || !text) return NextResponse.json({ ok: true });

  const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
  if (!tenant) return NextResponse.json({ ok: true });

  await prisma.message.create({
    data: { tenantId: tenant.id, phone: sender.replace(/[^0-9]/g, ""), direction: "in", body: text },
  });

  return NextResponse.json({ ok: true });
}
