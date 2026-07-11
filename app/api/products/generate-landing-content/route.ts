import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";
import { generateWithAI } from "@/lib/ai-providers";

function extractJson(text: string) {
  // AI kadang bungkus jawaban dalam ```json ... ``` — bersihin dulu sebelum di-parse
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

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

  if (!usingOwnKey && tenant.aiTokensUsed >= tenant.aiTokenLimit) {
    return NextResponse.json(
      {
        error: `Jatah gratis AI kamu udah habis (dipakai ${tenant.aiTokensUsed} dari ${tenant.aiTokenLimit} token). Isi kunci API sendiri di Pengaturan AI biar bisa lanjut pakai.`,
      },
      { status: 402 }
    );
  }

  const prompt = `Kamu bantu penjual online lengkapi konten landing page buat produknya.
Nama produk: "${name}"
${hint ? `Info tambahan dari penjual: "${hint}"` : ""}

Balas HANYA dalam format JSON persis seperti contoh di bawah, tanpa teks lain, tanpa markdown code block, tanpa basa-basi:
{"description": "1-2 kalimat bahasa Indonesia santai tapi meyakinkan", "benefitPoints": ["poin manfaat singkat 1", "poin manfaat singkat 2", "poin manfaat singkat 3"], "guaranteeText": "1 kalimat garansi yang masuk akal buat produk ini", "faq": [{"q": "pertanyaan singkat", "a": "jawaban singkat"}, {"q": "pertanyaan singkat", "a": "jawaban singkat"}, {"q": "pertanyaan singkat", "a": "jawaban singkat"}]}

Aturan: benefitPoints isi 3-5 poin, tiap poin maksimal 8 kata. faq isi 3 pasang tanya-jawab yang paling sering ditanyain calon pembeli produk ini. Jangan karang testimoni, angka penjualan, atau klaim yang gak masuk akal.`;

  try {
    const { text, totalTokens } = await generateWithAI(tenant.aiProvider, apiKey, prompt, tenant.aiModel || undefined);

    let parsed;
    try {
      parsed = extractJson(text);
    } catch {
      return NextResponse.json({ error: "AI ngasih jawaban yang gak bisa dibaca sistem. Coba klik lagi." }, { status: 502 });
    }

    if (!usingOwnKey) {
      await prisma.tenant.update({ where: { id: tenant.id }, data: { aiTokensUsed: { increment: totalTokens } } });
    }

    return NextResponse.json({
      description: parsed.description || "",
      benefitPoints: Array.isArray(parsed.benefitPoints) ? parsed.benefitPoints.join("\n") : "",
      guaranteeText: parsed.guaranteeText || "",
      faq: Array.isArray(parsed.faq) ? parsed.faq : [],
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Gagal minta bantuan AI. Detail: " + detail }, { status: 502 });
  }
}
