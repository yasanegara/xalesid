import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { name, hint } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Nama produk wajib diisi dulu." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Fitur AI belum aktif — ANTHROPIC_API_KEY belum diisi di server." }, { status: 500 });
  }

  const prompt = `Kamu bantu penjual online bikin deskripsi produk singkat buat landing page jualan.
Nama produk: "${name}"
${hint ? `Info tambahan dari penjual: "${hint}"` : ""}

Tulis 1 deskripsi singkat (maksimal 2 kalimat, bahasa Indonesia santai tapi meyakinkan) yang cocok ditaruh di bawah judul produk di halaman jualan.
Jangan pakai tanda kutip di jawabanmu. Langsung tulis deskripsinya saja, tanpa basa-basi atau penjelasan tambahan.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "Gagal minta bantuan AI: " + errText }, { status: 502 });
    }

    const data = await res.json();
    const description = data.content?.[0]?.text?.trim() || "";
    return NextResponse.json({ description });
  } catch (e) {
    return NextResponse.json({ error: "Gagal terhubung ke layanan AI." }, { status: 502 });
  }
}
