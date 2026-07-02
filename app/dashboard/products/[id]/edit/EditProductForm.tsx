"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isPhysical: boolean;
  digitalFileUrl: string | null;
};

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(String(product.price));
  const [isPhysical, setIsPhysical] = useState(product.isPhysical);
  const [digitalFileUrl, setDigitalFileUrl] = useState(product.digitalFileUrl || "");
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
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, price, isPhysical, digitalFileUrl }),
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
    <form onSubmit={handleSubmit} className="card-form">
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
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="1-2 kalimat tentang produk ini" />
        {aiError && <p style={{ fontSize: 12, color: "#9c0006", marginTop: 6 }}>{aiError}</p>}
      </div>

      <div className="auth-field">
        <label>Harga (Rupiah)</label>
        <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required />
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

      {error && <div className="auth-error">{error}</div>}

      <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Menyimpan..." : "Simpan perubahan"}
      </button>
    </form>
  );
}
