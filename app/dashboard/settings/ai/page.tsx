"use client";

import { useEffect, useState } from "react";

export default function AISettingsPage() {
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiApiKey, setAiApiKey] = useState("");
  const [hasOwnKey, setHasOwnKey] = useState(false);
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
        body: JSON.stringify({ aiProvider, aiApiKey }),
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

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Pengaturan AI</h1>
      </div>

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
            <option value="none">Matikan fitur AI</option>
          </select>
        </div>

        {aiProvider !== "none" && (
          <div className="auth-field">
            <label>
              Kunci API {aiProvider === "anthropic" ? "Anthropic" : "OpenAI"} kamu
              {aiProvider === "anthropic" && " (opsional)"}
            </label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder={hasOwnKey ? "Sudah tersimpan — isi ulang kalau mau ganti" : "sk-..."}
            />
            {aiProvider === "anthropic" ? (
              <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                Kalau dikosongin, dipakai kunci bawaan platform (gratis, tapi bisa kena batas pemakaian bersama).
                Isi kunci sendiri dari console.anthropic.com kalau mau pakai jatahmu sendiri.
              </p>
            ) : (
              <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                Wajib diisi — ambil dari platform.openai.com/api-keys. Platform gak nyediain kunci OpenAI gratis.
              </p>
            )}
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
