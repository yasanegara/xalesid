"use client";

import { useEffect, useState } from "react";

export default function TelegramSettingsPage() {
  const [connected, setConnected] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  function load() {
    fetch("/api/settings/telegram/current")
      .then((r) => r.json())
      .then((data) => {
        setConnected(!!data.connected);
        setTenantId(data.tenantId || "");
        setBotUsername(data.botUsername || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch("/api/settings/telegram", { method: "POST" });
    setDisconnecting(false);
    load();
  }

  if (loading) return <div className="page-wrap">Memuat...</div>;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Notifikasi Telegram</h1>
      </div>

      <div className="card-form">
        {connected ? (
          <>
            <p style={{ marginBottom: 16 }}>
              ✅ <b>Telegram kamu udah tersambung.</b> Kamu bakal dikabarin di Telegram tiap ada pembayaran masuk.
            </p>
            <button className="btn-primary" onClick={handleDisconnect} disabled={disconnecting} style={{ width: "100%" }}>
              {disconnecting ? "Memutuskan..." : "Putuskan koneksi"}
            </button>
          </>
        ) : botUsername ? (
          <>
            <p style={{ marginBottom: 16 }}>
              Belum tersambung. Klik tombol di bawah, nanti kebuka Telegram — tinggal tekan <b>Start</b> di sana.
            </p>
            <a
              className="btn-primary"
              href={`https://t.me/${botUsername}?start=${tenantId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: "100%", display: "block", textAlign: "center" }}
            >
              Connect ke Telegram
            </a>
          </>
        ) : (
          <p style={{ color: "#9c0006" }}>
            Fitur ini belum diaktifin sama pemilik platform (bot Telegram belum disiapin). Coba lagi nanti.
          </p>
        )}
      </div>
    </div>
  );
}
