"use client";

import { useEffect, useState } from "react";

export default function WhatsAppSettingsPage() {
  const [waProvider, setWaProvider] = useState("none");
  const [waApiKey, setWaApiKey] = useState("");
  const [waNotifyNumber, setWaNotifyNumber] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/whatsapp/current")
      .then((r) => r.json())
      .then((data) => {
        setWaProvider(data.waProvider || "none");
        setHasApiKey(!!data.hasApiKey);
        setWaNotifyNumber(data.waNotifyNumber || "");
        setTenantId(data.tenantId || "");
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
      const res = await fetch("/api/settings/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waProvider, waApiKey, waNotifyNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal simpan pengaturan.");
        return;
      }
      setMessage("Tersimpan!");
      if (waApiKey) setHasApiKey(true);
      setWaApiKey("");
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
        <h1>Notifikasi WhatsApp</h1>
      </div>

      <div className="hp-guarantee" style={{ maxWidth: 480, marginBottom: 20 }}>
        <b>💡 Perlu akun Fonnte (berbayar)</b>
        <p>
          Fitur ini pakai layanan pihak ketiga bernama Fonnte buat kirim pesan WA otomatis. Daftar &amp; hubungkan
          nomor WA kamu dulu di <b>fonnte.com</b>, ambil tokennya, baru isi di bawah. Fonnte punya biaya langganan
          sendiri di luar xales.id.
        </p>
      </div>

      <form onSubmit={handleSave} className="card-form">
        <div className="auth-field">
          <label>Aktifkan notifikasi WA?</label>
          <select
            value={waProvider}
            onChange={(e) => setWaProvider(e.target.value)}
            style={{ width: "100%", border: "2px solid #ddd", borderRadius: 8, padding: 11, fontSize: 15 }}
          >
            <option value="none">Matikan</option>
            <option value="fonnte">Aktif, pakai Fonnte</option>
          </select>
        </div>

        {waProvider === "fonnte" && (
          <>
            <div className="auth-field">
              <label>Token Fonnte</label>
              <input
                type="password"
                value={waApiKey}
                onChange={(e) => setWaApiKey(e.target.value)}
                placeholder={hasApiKey ? "Sudah tersimpan — isi ulang kalau mau ganti" : "Token dari fonnte.com"}
              />
            </div>
            <div className="auth-field">
              <label>Nomor WA kamu yang mau dikabarin</label>
              <input
                type="tel"
                value={waNotifyNumber}
                onChange={(e) => setWaNotifyNumber(e.target.value.replace(/[^0-9+]/g, ""))}
                placeholder="08123456789"
              />
            </div>
            {tenantId && (
              <div className="hp-guarantee">
                <b>🔗 Buat bisa balas chat di CRM</b>
                <p>
                  Biar pesan masuk dari pembeli kelihatan di menu Chat CRM, buka dashboard Fonnte → device kamu →
                  edit → isi <b>Webhook URL</b> dengan:
                  <br />
                  <code style={{ fontSize: 11, wordBreak: "break-all" }}>
                    https://xales.id/api/webhook/fonnte/{tenantId}
                  </code>
                </p>
              </div>
            )}
          </>
        )}

        {error && <div className="auth-error">{error}</div>}
        {message && <p style={{ color: "#1e7a34", fontWeight: 700, marginBottom: 14 }}>{message}</p>}

        <button className="btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
