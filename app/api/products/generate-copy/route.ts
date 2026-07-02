import { NextRequest, NextResponse } from "next/server";
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

  // User sekarang wajib pakai kunci API sendiri, apapun providernya
  const apiKey = tenant.aiApiKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: `Belum ada kunci API buat ${tenant.aiProvider}. Isi dulu di Pengaturan AI.` },
      { status: 400 }
    );
  }

  const prompt = `Kamu bantu penjual online bikin deskripsi produk singkat buat landing page jualan.
Nama produk: "${name}"
${hint ? `Info tambahan dari penjual: "${hint}"` : ""}

Tulis 1 deskripsi singkat (maksimal 2 kalimat, bahasa Indonesia santai tapi meyakinkan) yang cocok ditaruh di bawah judul produk di halaman jualan.
Jangan pakai tanda kutip di jawabanmu. Langsung tulis deskripsinya saja, tanpa basa-basi atau penjelasan tambahan.`;

  try {
    const description = await generateWithAI(tenant.aiProvider, apiKey, prompt);
    return NextResponse.json({ description });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Gagal minta bantuan AI. Detail: " + detail }, { status: 502 });
  }
}
