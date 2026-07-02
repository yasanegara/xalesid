import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";
import { generateWithAI } from "@/lib/ai-providers";

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  if (tenant.aiProvider === "none") {
    return NextResponse.json({ error: "Fitur AI dimatikan buat toko ini. Ubah di Pengaturan AI." }, { status: 400 });
  }

  const { name, hint } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Nama produk wajib diisi dulu." }, { status: 400 });
  }

  const usingOwnKey = !!tenant.aiApiKey;

  // Kalau user belum pasang kunci sendiri: cuma Anthropic yang punya jatah gratis dari platform
  let apiKey: string | undefined;
  if (usingOwnKey) {
    apiKey = tenant.aiApiKey!;
  } else if (tenant.aiProvider === "anthropic") {
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: `Belum ada kunci API buat ${tenant.aiProvider}. Isi dulu di Pengaturan AI.` },
      { status: 400 }
    );
  }

  // Cek kuota gratis (cuma berlaku kalau user gak pakai kunci sendiri)
  if (!usingOwnKey && tenant.aiTokensUsed >= tenant.aiTokenLimit) {
    return NextResponse.json(
      {
        error: `Jatah gratis AI kamu udah habis (dipakai ${tenant.aiTokensUsed} dari ${tenant.aiTokenLimit} token). Isi kunci API sendiri di Pengaturan AI biar bisa lanjut pakai.`,
      },
      { status: 402 }
    );
  }

  const prompt = `Kamu bantu penjual online bikin deskripsi produk singkat buat landing page jualan.
Nama produk: "${name}"
${hint ? `Info tambahan dari penjual: "${hint}"` : ""}

Tulis 1 deskripsi singkat (maksimal 2 kalimat, bahasa Indonesia santai tapi meyakinkan) yang cocok ditaruh di bawah judul produk di halaman jualan.
Jangan pakai tanda kutip di jawabanmu. Langsung tulis deskripsinya saja, tanpa basa-basi atau penjelasan tambahan.`;

  try {
    const { text, totalTokens } = await generateWithAI(tenant.aiProvider, apiKey, prompt);

    // Catat pemakaian token cuma kalau pakai jatah gratis platform, bukan kunci sendiri
    if (!usingOwnKey) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { aiTokensUsed: { increment: totalTokens } },
      });
    }

    return NextResponse.json({ description: text, tokensUsedThisCall: totalTokens, usingOwnKey });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Gagal minta bantuan AI. Detail: " + detail }, { status: 502 });
  }
}
