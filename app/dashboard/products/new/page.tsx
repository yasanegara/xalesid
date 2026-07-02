"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPhysical, setIsPhysical] = useState(false);
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function handleGenerateAI() {
    if (!name.trim()) {
      setAiError("Isi nama produk dulu ya, biar AI tahu mau nulis apa.");
      return;
    }
    setAiError("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/products/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, hint: description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Gagal minta bantuan AI.");
        return;
      }
      setDescription(data.description);
    } catch {
      setAiError("Gagal terhubung ke server. Coba lagi sebentar.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, price, isPhysical, digitalFileUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal bikin produk, coba lagi.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi sebentar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Produk baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="card-form">
        <div className="auth-field">
          <label>Nama produk</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Contoh: Ebook Resep Kue" />
        </div>

        <div className="auth-field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ marginBottom: 0 }}>Deskripsi singkat (opsional)</label>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={aiLoading}
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: "#fff3d6",
                color: "#9c6500",
                border: "none",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              {aiLoading ? "Nulis..." : "✨ Buatkan dengan AI"}
            </button>
          </div>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="1-2 kalimat tentang produk ini, atau kasih kata kunci lalu klik Buatkan dengan AI" />
          {aiError && <p style={{ fontSize: 12, color: "#9c0006", marginTop: 6 }}>{aiError}</p>}
        </div>

        <div className="auth-field">
          <label>Harga (Rupiah)</label>
          <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="79000" />
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox"
            id="isPhysical"
            checked={isPhysical}
            onChange={(e) => setIsPhysical(e.target.checked)}
          />
          <label htmlFor="isPhysical">Produk ini butuh dikirim (barang fisik)</label>
        </div>

        {!isPhysical && (
          <div className="auth-field">
            <label>Link file produk (Google Drive, dll)</label>
            <input
              value={digitalFileUrl}
              onChange={(e) => setDigitalFileUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              required={!isPhysical}
            />
          </div>
        )}

        {isPhysical && (
          <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>
            Untuk produk fisik, pembeli nanti diminta isi alamat pengiriman sendiri saat checkout.
          </p>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Menyimpan..." : "Simpan produk"}
        </button>
      </form>
    </div>
  );
}
