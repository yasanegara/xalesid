"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FAQItem = { q: string; a: string };

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isPhysical: boolean;
  digitalFileUrl: string | null;
  benefitPoints: string | null;
  photoUrl: string | null;
  guaranteeText: string | null;
  faqJson: string | null;
  aiHeadline: string | null;
  landingBlocksJson: string | null;
  stockEnabled: boolean;
  stockQty: number | null;
  showSoldCount: boolean;
  showViewingNow: boolean;
  promoPrice: number | null;
  promoEndsAt: string | null;
  socialProofEnabled: boolean;
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(String(product.price));
  const [isPhysical, setIsPhysical] = useState(product.isPhysical);
  const [digitalFileUrl, setDigitalFileUrl] = useState(product.digitalFileUrl || "");

  // Konten tambahan
  const [benefitPoints, setBenefitPoints] = useState(product.benefitPoints || "");
  const [photoUrl, setPhotoUrl] = useState(product.photoUrl || "");
  const [guaranteeText, setGuaranteeText] = useState(product.guaranteeText || "");
  const [faqItems, setFaqItems] = useState<FAQItem[]>(
    product.faqJson ? JSON.parse(product.faqJson) : []
  );
  const [aiHeadline, setAiHeadline] = useState(product.aiHeadline || "");
  const [landingBlocksJson, setLandingBlocksJson] = useState(product.landingBlocksJson || "");
  const aiSections = landingBlocksJson ? JSON.parse(landingBlocksJson) : null;

  // Scarcity
  const [stockEnabled, setStockEnabled] = useState(product.stockEnabled);
  const [stockQty, setStockQty] = useState(product.stockQty ? String(product.stockQty) : "");
  const [showSoldCount, setShowSoldCount] = useState(product.showSoldCount);
  const [showViewingNow, setShowViewingNow] = useState(product.showViewingNow);
  const [promoPrice, setPromoPrice] = useState(product.promoPrice ? String(product.promoPrice) : "");
  const [promoEndsAt, setPromoEndsAt] = useState(toDatetimeLocal(product.promoEndsAt));

  // Social proof
  const [socialProofEnabled, setSocialProofEnabled] = useState(product.socialProofEnabled);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [fullAiLoading, setFullAiLoading] = useState(false);
  const [fullAiError, setFullAiError] = useState("");

  async function handleGenerateFullContent() {
    if (!name.trim()) {
      setFullAiError("Isi nama produk dulu ya, biar AI tahu mau nulis apa.");
      return;
    }
    setFullAiError("");
    setFullAiLoading(true);
    try {
      const startRes = await fetch("/api/products/generate-landing-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, hint: description }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        setFullAiError(startData.error || "Gagal minta bantuan AI.");
        setFullAiLoading(false);
        return;
      }

      const jobId = startData.jobId;
      const maxAttempts = 40; // 40 x 3 detik = 2 menit maksimal nunggu
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/products/generate-landing-content/status?jobId=${jobId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "done") {
          const data = statusData.result;
          if (data?.description) setDescription(data.description);
          if (data?.benefitPoints) setBenefitPoints(data.benefitPoints);
          if (data?.guaranteeText) setGuaranteeText(data.guaranteeText);
          if (data?.faq && data.faq.length) setFaqItems(data.faq);
          if (data?.headline) setAiHeadline(data.headline);
          if (data?.sections) setLandingBlocksJson(JSON.stringify(data.sections));
          setFullAiLoading(false);
          return;
        }
        if (statusData.status === "failed") {
          setFullAiError("Gagal minta bantuan AI. Detail: " + (statusData.error || "gak diketahui"));
          setFullAiLoading(false);
          return;
        }
        // kalau masih "pending", lanjut nunggu lagi
      }
      setFullAiError("AI-nya kelamaan mikir (lebih dari 2 menit). Coba lagi, atau ganti model di Pengaturan AI.");
    } catch {
      setFullAiError("Gagal terhubung ke server. Coba lagi sebentar.");
    } finally {
      setFullAiLoading(false);
    }
  }

  async function handleGenerateAI() {
    if (!name.trim()) {
      setAiError("Isi nama produk dulu ya, biar AI tahu mau nulis apa.");
      return;
    }
    setAiError("");
    setAiLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch("/api/products/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, hint: description }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Gagal minta bantuan AI.");
        return;
      }
      setDescription(data.description);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        setAiError("AI-nya kelamaan mikir. Coba lagi atau ganti model di Pengaturan AI.");
      } else {
        setAiError("Gagal terhubung ke server. Coba lagi sebentar.");
      }
    } finally {
      setAiLoading(false);
    }
  }

  function addFaqItem() {
    setFaqItems([...faqItems, { q: "", a: "" }]);
  }
  function updateFaqItem(i: number, field: "q" | "a", value: string) {
    const next = [...faqItems];
    next[i] = { ...next[i], [field]: value };
    setFaqItems(next);
  }
  function removeFaqItem(i: number) {
    setFaqItems(faqItems.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price,
          isPhysical,
          digitalFileUrl,
          benefitPoints,
          photoUrl,
          guaranteeText,
          faqJson: faqItems.length ? JSON.stringify(faqItems.filter((f) => f.q.trim())) : "",
          aiHeadline,
          landingBlocksJson,
          stockEnabled,
          stockQty,
          showSoldCount,
          showViewingNow,
          promoPrice,
          promoEndsAt: promoEndsAt ? new Date(promoEndsAt).toISOString() : "",
          socialProofEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal simpan perubahan.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server. Coba lagi sebentar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-form" style={{ maxWidth: 560 }}>
      <div
        style={{
          background: "#fff3d6",
          border: "2px dashed #b8860b",
          borderRadius: 10,
          padding: 14,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={handleGenerateFullContent}
          disabled={fullAiLoading}
          className="btn-primary"
          style={{ width: "100%" }}
        >
          {fullAiLoading ? "AI lagi nulis..." : "🪄 Generate Semua Konten Landing Page dengan AI"}
        </button>
        <p style={{ fontSize: 12, color: "#666", marginTop: 8, marginBottom: 0 }}>
          Isi deskripsi, poin manfaat, garansi, dan FAQ sekaligus dalam 1 klik. Hasilnya tetap bisa kamu edit manual.
        </p>
        {fullAiLoading && (
          <div style={{ marginTop: 12 }}>
            <div className="ai-skeleton-row" style={{ width: "90%" }} />
            <div className="ai-skeleton-row" style={{ width: "75%" }} />
            <div className="ai-skeleton-row" style={{ width: "60%" }} />
            <div className="ai-progress-text">
              <span className="ai-spinner" />
              Sedang mikir... biasanya 10-30 detik, bisa lebih lama kalau lagi antre
            </div>
          </div>
        )}
        {fullAiError && <p style={{ fontSize: 12, color: "#9c0006", marginTop: 8 }}>{fullAiError}</p>}
      </div>

      {aiSections && (
        <div style={{ background: "#eef3ff", border: "1.5px solid #1d4ed8", borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <b style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
            ✅ AI udah nyusun {aiSections.length} section buat halaman ini
          </b>
          {aiHeadline && <p style={{ fontSize: 13, marginBottom: 6 }}>Headline: "{aiHeadline}"</p>}
          <ul style={{ fontSize: 12.5, color: "#444", paddingLeft: 18, marginBottom: 10 }}>
            {aiSections.map((s: any, i: number) => (
              <li key={i}>{s.title || s.type} ({s.type})</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setAiHeadline("");
              setLandingBlocksJson("");
            }}
            style={{ fontSize: 12, fontWeight: 700, background: "none", border: "1px solid #1d4ed8", color: "#1d4ed8", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
          >
            Hapus, balik ke mode manual (field di bawah)
          </button>
        </div>
      )}

      {/* ── Dasar ── */}
      <div className="auth-field">
        <label>Nama produk</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="auth-field">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ marginBottom: 0 }}>Deskripsi di landing page</label>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={aiLoading}
            style={{ fontSize: 12, fontWeight: 700, background: "#fff3d6", color: "#9c6500", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
          >
            {aiLoading ? "Nulis..." : "✨ Buatkan dengan AI"}
          </button>
        </div>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="1-2 kalimat tentang produk ini" />
        {aiLoading && (
          <div className="ai-progress-text">
            <span className="ai-spinner" />
            Sedang mikir...
          </div>
        )}
        {aiError && <p style={{ fontSize: 12, color: "#9c0006", marginTop: 6 }}>{aiError}</p>}
      </div>

      <div className="auth-field">
        <label>Harga (Rupiah)</label>
        <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>

      <div className="checkbox-row">
        <input type="checkbox" id="isPhysical" checked={isPhysical} onChange={(e) => setIsPhysical(e.target.checked)} />
        <label htmlFor="isPhysical">Produk ini butuh dikirim (barang fisik)</label>
      </div>

      {!isPhysical && (
        <div className="auth-field">
          <label>Link file produk (Google Drive, dll)</label>
          <input value={digitalFileUrl} onChange={(e) => setDigitalFileUrl(e.target.value)} placeholder="https://drive.google.com/..." required={!isPhysical} />
        </div>
      )}

      {/* ── Konten tambahan ── */}
      <details style={{ marginTop: 24, marginBottom: 8 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14, padding: "8px 0" }}>
          📝 Konten tambahan (opsional)
        </summary>
        <div style={{ paddingTop: 12 }}>
          <div className="auth-field">
            <label>Poin manfaat (1 baris = 1 poin)</label>
            <textarea
              value={benefitPoints}
              onChange={(e) => setBenefitPoints(e.target.value)}
              placeholder={"Contoh:\nHemat waktu 2 jam sehari\nGak perlu install apa-apa\nBisa dipakai di HP"}
              style={{ width: "100%", border: "2px solid #ddd", borderRadius: 8, padding: 11, fontSize: 14, minHeight: 90, fontFamily: "inherit" }}
            />
          </div>
          <div className="auth-field">
            <label>Link foto produk</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="auth-field">
            <label>Teks garansi</label>
            <input value={guaranteeText} onChange={(e) => setGuaranteeText(e.target.value)} placeholder="Contoh: Garansi 7 hari uang kembali" />
          </div>
          <div className="auth-field">
            <label>FAQ</label>
            {faqItems.map((item, i) => (
              <div key={i} style={{ border: "1.5px solid #eee", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <input
                  value={item.q}
                  onChange={(e) => updateFaqItem(i, "q", e.target.value)}
                  placeholder="Pertanyaan"
                  style={{ marginBottom: 6 }}
                />
                <input value={item.a} onChange={(e) => updateFaqItem(i, "a", e.target.value)} placeholder="Jawaban" />
                <button
                  type="button"
                  onClick={() => removeFaqItem(i)}
                  style={{ fontSize: 12, color: "#9c0006", background: "none", border: "none", cursor: "pointer", marginTop: 6, padding: 0 }}
                >
                  Hapus
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFaqItem}
              style={{ fontSize: 12, fontWeight: 700, background: "#f0ede3", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}
            >
              + Tambah pertanyaan
            </button>
          </div>
        </div>
      </details>

      {/* ── Scarcity ── */}
      <details style={{ marginBottom: 8 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14, padding: "8px 0" }}>
          ⏳ Scarcity — data asli, bukan settingan bohongan (opsional)
        </summary>
        <div style={{ paddingTop: 12 }}>
          <div className="checkbox-row">
            <input type="checkbox" id="stockEnabled" checked={stockEnabled} onChange={(e) => setStockEnabled(e.target.checked)} />
            <label htmlFor="stockEnabled">Batasi stok</label>
          </div>
          {stockEnabled && (
            <div className="auth-field">
              <label>Jumlah stok</label>
              <input type="number" min={0} value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
              <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                Sisa stok dihitung otomatis dari jumlah pesanan yang udah lunas.
              </p>
            </div>
          )}

          <div className="checkbox-row">
            <input type="checkbox" id="showSoldCount" checked={showSoldCount} onChange={(e) => setShowSoldCount(e.target.checked)} />
            <label htmlFor="showSoldCount">Tampilkan "sudah X terjual" (angka asli dari data pesanan)</label>
          </div>

          <div className="checkbox-row">
            <input type="checkbox" id="showViewingNow" checked={showViewingNow} onChange={(e) => setShowViewingNow(e.target.checked)} />
            <label htmlFor="showViewingNow">Tampilkan "X orang lagi lihat" (dihitung dari pengunjung 5 menit terakhir)</label>
          </div>

          <div className="auth-field">
            <label>Harga promo (opsional, lebih murah dari harga normal)</label>
            <input type="number" min={1} value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} />
          </div>
          {promoPrice && (
            <div className="auth-field">
              <label>Promo berakhir kapan</label>
              <input type="datetime-local" value={promoEndsAt} onChange={(e) => setPromoEndsAt(e.target.value)} />
              <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                Setelah waktu ini lewat, harga otomatis balik ke harga normal.
              </p>
            </div>
          )}
        </div>
      </details>

      {/* ── Social proof ── */}
      <details style={{ marginBottom: 20 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14, padding: "8px 0" }}>
          🔔 Social proof (opsional)
        </summary>
        <div style={{ paddingTop: 12 }}>
          <div className="checkbox-row">
            <input type="checkbox" id="socialProofEnabled" checked={socialProofEnabled} onChange={(e) => setSocialProofEnabled(e.target.checked)} />
            <label htmlFor="socialProofEnabled">Tampilkan pop-up "X baru aja beli" (nama asli pembeli, disingkat)</label>
          </div>
          <p style={{ fontSize: 12, color: "#666" }}>
            Pop-up ini cuma muncul kalau udah ada minimal 1 pembeli asli. Nama ditampilkan disingkat (contoh: "Budi S.") demi privasi.
          </p>
        </div>
      </details>

      {error && <div className="auth-error">{error}</div>}

      <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Menyimpan..." : "Simpan perubahan"}
      </button>
    </form>
  );
}
