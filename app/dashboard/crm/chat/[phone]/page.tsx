"use client";

import { useEffect, useRef, useState } from "react";

type Message = { id: string; direction: string; body: string; createdAt: string };

export default function ChatPage({ params }: { params: { phone: string } }) {
  const phone = decodeURIComponent(params.phone);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    fetch(`/api/messages?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // polling tiap 5 detik, biar ada pesan baru kelihatan
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal kirim pesan.");
        return;
      }
      setText("");
      load();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>Chat — {phone}</h1>
        <a
          href={`https://wa.me/${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 700, color: "#111", border: "1.5px solid #111", borderRadius: 6, padding: "6px 12px", textDecoration: "none" }}
        >
          Buka di WhatsApp
        </a>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e7e2d6",
          borderRadius: 12,
          padding: 16,
          height: 420,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {messages.length === 0 && <p style={{ color: "#999", fontSize: 13, textAlign: "center", marginTop: 20 }}>Belum ada pesan.</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.direction === "out" ? "flex-end" : "flex-start",
              background: m.direction === "out" ? "#f2c200" : "#f0ede3",
              borderRadius: 10,
              padding: "8px 12px",
              maxWidth: "75%",
              fontSize: 14,
            }}
          >
            {m.body}
            <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
              {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan..."
          style={{ flex: 1, border: "2px solid #ddd", borderRadius: 8, padding: 11, fontSize: 14 }}
        />
        <button className="btn-primary" type="submit" disabled={sending}>
          Kirim
        </button>
      </form>
      {error && <p style={{ fontSize: 12, color: "#9c0006", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
