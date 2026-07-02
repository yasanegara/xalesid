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
          <label>Deskripsi singkat (opsional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="1-2 kalimat tentang produk ini" />
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
