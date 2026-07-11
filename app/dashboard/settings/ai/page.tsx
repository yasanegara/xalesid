"use client";

import { useEffect, useState } from "react";

export default function AISettingsPage() {
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [hasOwnKey, setHasOwnKey] = useState(false);
  const [aiTokensUsed, setAiTokensUsed] = useState(0);
  const [aiTokenLimit, setAiTokenLimit] = useState(25000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/ai/current")
      .then((r) => r.json())
      .then((data) => {
        setAiProvider(data.aiProvider || "anthropic");
        setHasOwnKey(!!data.hasOwnKey);
        setAiModel(data.aiModel || "");
        setAiTokensUsed(data.aiTokensUsed || 0);
        setAiTokenLimit(data.aiTokenLimit || 25000);
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
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProvider, aiApiKey, aiModel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal simpan pengaturan.");
        return;
      }
      setMessage("Tersimpan!");
      setHasOwnKey(!!aiApiKey);
      setAiApiKey("");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi sebentar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-wrap">Memuat...</div>;

  const pct = Math.min(100, Math.round((aiTokensUsed / aiTokenLimit) * 100));

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Pengaturan AI</h1>
      </div>

      {!hasOwnKey && aiProvider === "anthropic" && (
        <div className="card-form" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
            <span style={{ fontWeight: 700 }}>Jatah gratis dari platform</span>
            <span>
              {aiTokensUsed.toLocaleString("id-ID")} / {aiTokenLimit.toLocaleString("id-ID")} token
            </span>
          </div>
          <div style={{ background: "#f0ede3", borderRadius: 6, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: pct >= 90 ? "#c0202e" : "#f2c200", height: "100%", borderRadius: 6 }} />
          </div>
          {pct >= 90 && (
            <p style={{ fontSize: 12, color: "#9c0006", marginTop: 8 }}>
              Jatah gratis hampir habis. Isi kunci API sendiri di bawah biar gak keputus.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="card-form">
        <div className="auth-field">
          <label>Pakai AI dari mana?</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            style={{ width: "100%", border: "2px solid #ddd", borderRadius: 8, padding: 11, fontSize: 15 }}
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI (ChatGPT)</option>
            <option value="sumopod">Sumopod AI (banyak pilihan model, hemat)</option>
            <option value="none">Matikan fitur AI</option>
          </select>
        </div>

        {aiProvider === "sumopod" && (
          <div className="auth-field">
            <label>Model yang dipakai</label>
            <input
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="claude-sonnet-4-6"
            />
            <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Lihat daftar model &amp; harga lengkap di sumopod.com/dashboard/ai/models, copy id modelnya ke sini.
              Kalau dikosongin, default pakai <code>claude-sonnet-4-6</code>.
            </p>
          </div>
        )}

        {aiProvider !== "none" && (
          <div className="auth-field">
            <label>
              Kunci API {aiProvider === "anthropic" ? "Anthropic" : aiProvider === "sumopod" ? "Sumopod" : "OpenAI"} kamu
            </label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder={hasOwnKey ? "Sudah tersimpan — isi ulang kalau mau ganti" : "sk-..."}
            />
            <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              {aiProvider === "anthropic" && "Boleh dikosongin dulu buat pakai jatah gratis platform. Isi sendiri kalau jatah gratisnya habis."}
              {aiProvider === "openai" && "Wajib diisi — ambil dari platform.openai.com/api-keys."}
              {aiProvider === "sumopod" && "Wajib diisi — bikin key di ai.sumopod.com > AI > API Keys."}
            </p>
          </div>
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
