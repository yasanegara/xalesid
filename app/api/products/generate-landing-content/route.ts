import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";
import { generateWithAI } from "@/lib/ai-providers";

function extractJson(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// Langsung balik cepet, kasih jobId — prosesnya jalan sendiri di belakang layar
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

  const job = await prisma.aiJob.create({ data: { tenantId: tenant.id, status: "pending" } });

  runGeneration(job.id, tenant.id, tenant.aiProvider, apiKey, tenant.aiModel, usingOwnKey, name, hint).catch(() => {});

  return NextResponse.json({ jobId: job.id });
}

async function runGeneration(
  jobId: string,
  tenantId: string,
  aiProvider: string,
  apiKey: string,
  aiModel: string | null,
  usingOwnKey: boolean,
  name: string,
  hint: string
) {
  const prompt = `Kamu adalah copywriter sales page kelas atas, gayanya kayak Alex Hormozi: to the point, blak-blakan soal masalah, tawaran yang jelas nilainya, gak bertele-tele, tapi tetap kedengaran profesional (bukan norak/lebay).

Produk yang mau dijual: "${name}"
${hint ? `Info tambahan dari penjual: "${hint}"` : ""}

Tugas kamu:
1. Kenali dulu produk ini jualan ke siapa (segmen/persona) dan masalah apa yang dia selesaikan — jangan ditulis eksplisit, tapi pakai buat nentuin copy-nya.
2. Rancang STRUKTUR halaman jualan ini SENDIRI — kamu yang mutusin section apa aja yang relevan buat produk ini, gak semua produk butuh section yang sama. Boleh 2 section, boleh 5, terserah kamu, yang penting pas buat produknya.
3. Tulis semua copy-nya dalam Bahasa Indonesia.

Pilihan jenis section yang boleh kamu pakai (pilih yang relevan aja, urutannya bebas kamu tentuin):
- "pain": angkat masalah/kegelisahan calon pembeli sebelum punya produk ini. Field: title, points (array string, 3-4 poin, tiap poin 1 kalimat pendek yang nyentil).
- "benefits": manfaat konkret dari produk ini. Field: title, points (array string, 3-5 poin, tiap poin maksimal 10 kata).
- "mechanism": cara kerja/cara pakai produknya, kalau relevan (misal produk yang prosesnya perlu dijelasin). Field: title, steps (array of {title, description}, 2-4 langkah).
- "guarantee": jaminan yang masuk akal buat produk ini. Field: text (1 kalimat).
- "faq": pertanyaan yang paling mungkin muncul di kepala calon pembeli. Field: items (array of {q, a}, 2-4 pasang).

Balas HANYA dalam format JSON persis kayak contoh ini, tanpa teks lain, tanpa markdown code block:
{
  "headline": "judul hero yang nendang, bukan cuma nama produk doang, maksimal 8 kata",
  "description": "1-2 kalimat subjudul di bawah headline",
  "closingHeadline": "1 kalimat penutup buat ajakan beli di paling bawah halaman",
  "sections": [
    {"type": "pain", "title": "...", "points": ["...", "..."]},
    {"type": "benefits", "title": "...", "points": ["...", "..."]}
  ]
}

Aturan penting: JANGAN karang testimoni, angka penjualan, atau klaim yang gak masuk akal. Copy-nya harus jujur berdasarkan info produk yang dikasih.`;

  try {
    const { text, totalTokens } = await generateWithAI(aiProvider, apiKey, prompt, aiModel || undefined, 1800);
    let parsed;
    try {
      parsed = extractJson(text);
    } catch {
      throw new Error(
        `AI ngasih jawaban yang gak lengkap/gak bisa dibaca. Coba lagi. (Potongan jawaban: ${text.slice(0, 150)})`
      );
    }

    if (!usingOwnKey) {
      await prisma.tenant.update({ where: { id: tenantId }, data: { aiTokensUsed: { increment: totalTokens } } });
    }

    // Sekalian susun versi "field sederhana" dari hasil section-section AI,
    // biar tetap ada yang bisa diedit manual kalau usernya mau
    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
    const benefitsSection = sections.find((s: any) => s.type === "benefits");
    const guaranteeSection = sections.find((s: any) => s.type === "guarantee");
    const faqSection = sections.find((s: any) => s.type === "faq");

    await prisma.aiJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        resultJson: JSON.stringify({
          headline: parsed.headline || "",
          description: parsed.description || "",
          closingHeadline: parsed.closingHeadline || "",
          sections,
          // Fallback versi sederhana, dari section yang cocok kalau ada
          benefitPoints: benefitsSection?.points ? benefitsSection.points.join("\n") : "",
          guaranteeText: guaranteeSection?.text || "",
          faq: faqSection?.items || [],
        }),
      },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    await prisma.aiJob.update({ where: { id: jobId }, data: { status: "failed", errorText: detail } });
  }
}
