"use client";

import { useEffect, useState } from "react";

export default function PaymentSettingsPage() {
  const [midtransClientKey, setMidtransClientKey] = useState("");
  const [midtransServerKey, setMidtransServerKey] = useState("");
  const [midtransIsProd, setMidtransIsProd] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/payment/current")
      .then((r) => r.json())
      .then((data) => {
        setMidtransClientKey(data.midtransClientKey || "");
        setMidtransIsProd(!!data.midtransIsProd);
        setHasServerKey(!!data.hasServerKey);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ midtransServerKey, midtransClientKey, midtransIsProd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal simpan pengaturan.");
        return;
      }
      setMessage("Tersimpan!");
      if (midtransServerKey) setHasServerKey(true);
      setMidtransServerKey("");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi sebentar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-wrap">Memuat...</div>;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Pengaturan pembayaran</h1>
      </div>

      <form onSubmit={handleSave} className="card-form">
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="isProd"
            checked={midtransIsProd}
            onChange={(e) => setMidtransIsProd(e.target.checked)}
          />
          <label htmlFor="isProd">Mode Production (uang beneran, bukan latihan)</label>
        </div>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 18 }}>
          Biarin gak dicentang dulu buat coba-coba (mode Sandbox). Centang kalau udah siap terima pembayaran asli.
        </p>

        <div className="auth-field">
          <label>Client Key Midtrans</label>
          <input
            value={midtransClientKey}
            onChange={(e) => setMidtransClientKey(e.target.value)}
            placeholder="SB-Mid-client-xxxxxxx"
          />
          <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Dari dashboard.midtrans.com &gt; Settings &gt; Access Keys. Boleh dilihat orang lain, gak rahasia.
          </p>
        </div>

        <div className="auth-field">
          <label>Server Key Midtrans</label>
          <input
            type="password"
            value={midtransServerKey}
            onChange={(e) => setMidtransServerKey(e.target.value)}
            placeholder={hasServerKey ? "Sudah tersimpan — isi ulang kalau mau ganti" : "SB-Mid-server-xxxxxxx"}
          />
          <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Ini rahasia, jangan dikasih ke siapa-siapa. Dari halaman yang sama di Midtrans.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <p style={{ color: "#1e7a34", fontWeight: 700, marginBottom: 14 }}>{message}</p>}

        <button className="btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </form>

      <p style={{ fontSize: 12, color: "#666", marginTop: 20, maxWidth: 480 }}>
        Jangan lupa: di dashboard.midtrans.com &gt; Settings &gt; Configuration, isi <b>Payment Notification URL</b> dengan:
        <br />
        <code>https://xales.id/api/webhook/midtrans</code>
        <br />
        Ini biar Midtrans bisa ngabarin sistem kita begitu ada pembayaran masuk.
      </p>
    </div>
  );
}
