import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";
import { generateWithAI } from "@/lib/ai-providers";
import { fetchReferenceText } from "@/lib/fetch-reference-text";

function extractJson(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// Bersihin karakter yang gak seharusnya ada di teks Bahasa Indonesia (misal aksara asing nyasar)
function stripForeignScript(value: any): any {
  if (typeof value === "string") {
    return value.replace(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g, "").replace(/\s{2,}/g, " ").trim();
  }
  if (Array.isArray(value)) return value.map(stripForeignScript);
  if (value && typeof value === "object") {
    const out: any = {};
    for (const k in value) out[k] = stripForeignScript(value[k]);
    return out;
  }
  return value;
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

PENTING soal STRUKTUR — baca baik-baik:
Kamu BEBAS milih section apa aja yang dipakai, JANGAN asal pakai semua jenis yang tersedia. Pikirkan dulu produk ini butuh apa:
- Produk simpel/murah/gampang dipahami → cukup 2-3 section aja, gak usah lengkap-lengkap amat
- Produk yang perlu dijelasin/agak mahal/butuh keyakinan lebih → boleh lebih banyak section
JANGAN selalu pakai urutan pain→benefits→mechanism→guarantee→faq secara berurutan kayak checklist. Pilih dan urutkan sesuai APA YANG PALING MASUK AKAL buat produk dan segmen ini, bisa lompat-lompat, bisa skip beberapa jenis sama sekali.

Pilihan jenis section yang boleh kamu pakai (pilih yang RELEVAN aja):
- "pain": masalah/kegelisahan calon pembeli sebelum punya produk ini. Field: title, points (array of {text, icon}, 3-4 poin).
- "benefits": manfaat konkret. Field: title, points (array of {text, icon}, 3-5 poin, maksimal 10 kata per poin).
- "mechanism": cara kerja/cara pakai, kalau prosesnya perlu dijelasin. Field: title, steps (array of {title, description}, 2-4 langkah).
- "stats": angka/fakta yang menarik tentang produk ini sendiri (BUKAN angka penjualan/testimoni palsu — misal jumlah item dalam paket, durasi akses, dll). Field: title, items (array of {value, label}, 3-4 item — value itu angka/teks pendek kayak "50+" atau "24 Jam", label itu keterangannya).
- "comparison": bandingin 2 hal (misal "cara lama vs cara pakai produk ini"). Field: title, leftLabel, rightLabel, rows (array of {left, right}, 3-4 baris perbandingan singkat).
- "story": 1 paragraf narasi pendek yang relatable buat segmen pembeli (skenario sehari-hari yang mereka alami). Field: title, text (2-4 kalimat).
- "objection": jawab 1 keraguan besar yang mungkin bikin orang ragu beli. Field: title, text (1-2 kalimat).
- "guarantee": jaminan yang masuk akal. Field: text (1 kalimat).
- "faq": pertanyaan yang sering muncul. Field: items (array of {q, a}, 2-4 pasang).

Balas HANYA dalam format JSON persis kayak contoh ini, tanpa teks lain, tanpa markdown code block:
{
  "headline": "judul hero yang nendang, maksimal 8 kata",
  "description": "1-2 kalimat subjudul di bawah headline",
  "closingHeadline": "1 kalimat penutup buat ajakan beli",
  "stylePresetChosen": "${isAuto ? "isi salah satu: brutal | minimal | playful | glass | neuro" : stylePreset}",
  "sections": [
    {"type": "benefits", "title": "...", "points": [{"text": "...", "icon": "🚀"}]}
  ]
}

Aturan penting:
- JANGAN karang testimoni, angka penjualan, atau klaim yang gak masuk akal.
- JANGAN nyalin kalimat dari referensi website kata per kata.
- Tulis dalam Bahasa Indonesia yang rapi dan natural — PERIKSA LAGI sebelum jawab: pastikan ada spasi yang benar antar kata (jangan sampai kata nempel kayak "tiketyang" atau "uangkamu"), dan JANGAN pakai aksara/huruf non-Latin (Kanji, Hangul, dll) sama sekali.`;

  try {
    const { text, totalTokens } = await generateWithAI(
      aiProvider,
      apiKey,
      prompt,
      aiModel || undefined,
      2200,
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

    parsed = stripForeignScript(parsed);

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
