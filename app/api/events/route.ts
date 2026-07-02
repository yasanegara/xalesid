import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["page_view", "cta_click", "checkout_start", "payment_success"];

export async function POST(req: NextRequest) {
  try {
    const { productId, type, visitorId } = await req.json();
    if (!productId || !ALLOWED_TYPES.includes(type) || !visitorId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    // Gak perlu nunggu / gak perlu login — ini dari pengunjung publik
    await prisma.event.create({ data: { productId, type, visitorId } });
    return NextResponse.json({ ok: true });
  } catch {
    // Event gagal kecatat itu gak boleh bikin halaman pembeli error, jadi tetap balas OK
    return NextResponse.json({ ok: false });
  }
}
