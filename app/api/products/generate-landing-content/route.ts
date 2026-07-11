import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";
import { generateWithAI } from "@/lib/ai-providers";
import { fetchReferenceText } from "@/lib/fetch-reference-text";

function extractJson(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

const STYLE_LABEL: Record<string, string> = {
  brutal: "Brutal — border tebal, bayangan keras tanpa blur, warna kontras tegas, headline besar, blak-blakan kayak Alex Hormozi",
  minimal: "Minimalis & Elegan — kalem, banyak ruang kosong, kata-kata dipilih hemat, percaya diri tanpa teriak-teriak",
  playful: "Playful & Santai — akrab, ngobrol kayak temen, boleh sedikit humor ringan, bentuk-bentuk bulat & ceria",
  glass: "Glassmorphism — modern, premium, melayang, tenang tapi berkelas",
  neuro: "Neumorphism — lembut, halus, tenang, monokrom, terasa mahal & clean",
};

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  if (tenant.aiProvider === "none") {
    return NextResponse.json({ error: "Fitur AI dimatikan buat toko ini. Ubah di Pengaturan AI." }, { status: 400 });
  }

  const { name, hint, stylePreset, referenceUrl, referenceImageUrl } = await req.json();
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

  runGeneration(
    job.id,
    tenant.id,
    tenant.aiProvider,
    apiKey,
    tenant.aiModel,
    usingOwnKey,
    name,
    hint,
    stylePreset || "auto",
    referenceUrl || "",
    referenceImageUrl || ""
  ).catch(() => {});

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
  hint: string,
  stylePreset: string,
  referenceUrl: string,
  referenceImageUrl: string
) {
  let referenceText = "";
  if (referenceUrl) {
    referenceText = await fetchReferenceText(referenceUrl);
  }

  const isAuto = stylePreset === "auto";
  const styleInstruction = isAuto
    ? `Kamu yang PILIH sendiri gaya desain paling pas buat produk ini, dari 5 opsi: brutal (Bold ala Hormozi), minimal (Minimalis & Elegan), playful (Playful & Santai), glass (Glassmorphism, modern-premium), neuro (Neumorphism, lembut-clean). Pertimbangkan segmen pembeli & jenis produknya sebelum milih.`
    : `Gaya desain yang WAJIB kamu pakai: ${STYLE_LABEL[stylePreset] || STYLE_LABEL.brutal}.`;

  const prompt = `Kamu berperan sebagai TIM GABUNGAN: (1) UI/UX designer senior yang paham psikologi visual & hierarki informasi, dan (2) copywriter/marketer kelas atas gaya Alex Hormozi — to the point, jujur soal masalah, tawaran jelas nilainya, gak bertele-tele tapi tetap profesional.

Produk yang mau dijual: "${name}"
${hint ? `Info tambahan dari penjual: "${hint}"` : ""}
${referenceText ? `\nReferensi gaya bahasa dari website lain (JANGAN disalin kata-katanya persis, cuma buat kamu ngerti "vibe"-nya): "${referenceText}"` : ""}
${referenceImageUrl ? `\nDi pesan ini juga ada gambar poster referensi — perhatiin mood, target audience, dan gaya visualnya, sesuaikan nada tulisanmu biar nyambung sama gambar itu.` : ""}

${styleInstruction}

Tugas kamu:
1. Kenali dulu produk ini jualan ke siapa (segmen/persona) dan masalah apa yang dia selesaikan — jangan ditulis eksplisit, tapi pakai buat nentuin copy-nya.
2. Rancang STRUKTUR halaman jualan ini SENDIRI — kamu yang mutusin section apa aja yang relevan buat produk ini, gak semua produk butuh section yang sama. Boleh 2 section, boleh 5, terserah kamu, yang penting pas buat produknya dan segmennya.
3. Tulis semua copy-nya dalam Bahasa Indonesia, dengan gaya yang udah ditentuin di atas.

Pilihan jenis section yang boleh kamu pakai (pilih yang relevan aja, urutannya bebas kamu tentuin):
- "pain": angkat masalah/kegelisahan calon pembeli sebelum punya produk ini. Field: title, points (array of {text, icon}, 3-4 poin — text 1 kalimat pendek yang nyentil, icon 1 emoji yang pas buat poin itu).
- "benefits": manfaat konkret dari produk ini. Field: title, points (array of {text, icon}, 3-5 poin — text maksimal 10 kata, icon 1 emoji yang pas buat poin itu).
- "mechanism": cara kerja/cara pakai produknya, kalau relevan. Field: title, steps (array of {title, description}, 2-4 langkah).
- "guarantee": jaminan yang masuk akal buat produk ini. Field: text (1 kalimat).
- "faq": pertanyaan yang paling mungkin muncul di kepala calon pembeli. Field: items (array of {q, a}, 2-4 pasang).

Balas HANYA dalam format JSON persis kayak contoh ini, tanpa teks lain, tanpa markdown code block:
{
  "headline": "judul hero yang nendang, bukan cuma nama produk doang, maksimal 8 kata",
  "description": "1-2 kalimat subjudul di bawah headline",
  "closingHeadline": "1 kalimat penutup buat ajakan beli di paling bawah halaman",
  "stylePresetChosen": "${isAuto ? "isi salah satu: brutal | minimal | playful | glass | neuro" : stylePreset}",
  "sections": [
    {"type": "pain", "title": "...", "points": [{"text": "...", "icon": "😩"}, {"text": "...", "icon": "⏰"}]},
    {"type": "benefits", "title": "...", "points": [{"text": "...", "icon": "🚀"}, {"text": "...", "icon": "✅"}]}
  ]
}

Aturan penting: JANGAN karang testimoni, angka penjualan, atau klaim yang gak masuk akal. Copy-nya harus jujur berdasarkan info produk yang dikasih. JANGAN nyalin kalimat dari referensi website kata per kata.`;

  try {
    const { text, totalTokens } = await generateWithAI(
      aiProvider,
      apiKey,
      prompt,
      aiModel || undefined,
      1800,
      referenceImageUrl || undefined
    );
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

    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
    const benefitsSection = sections.find((s: any) => s.type === "benefits");
    const guaranteeSection = sections.find((s: any) => s.type === "guarantee");
    const faqSection = sections.find((s: any) => s.type === "faq");

    const validStyles = ["brutal", "minimal", "playful", "glass", "neuro"];
    const chosenStyle = validStyles.includes(parsed.stylePresetChosen) ? parsed.stylePresetChosen : (isAuto ? "brutal" : stylePreset);

    await prisma.aiJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        resultJson: JSON.stringify({
          headline: parsed.headline || "",
          description: parsed.description || "",
          closingHeadline: parsed.closingHeadline || "",
          sections,
          stylePresetChosen: chosenStyle,
          benefitPoints: benefitsSection?.points
            ? benefitsSection.points.map((p: any) => (typeof p === "string" ? p : p.text)).join("\n")
            : "",
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
