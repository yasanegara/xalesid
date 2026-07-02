"use client";

function getVisitorId(): string {
  const key = "xales_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function trackEvent(type: string, productId: string) {
  try {
    const payload = JSON.stringify({ productId, type, visitorId: getVisitorId() });
    // sendBeacon dipakai biar tetap terkirim walau halamannya langsung pindah
    // (misal pas orang klik tombol beli terus langsung loncat ke halaman checkout)
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
    }
  } catch {
    // Kalau gagal kecatat, biarin aja — jangan sampai ganggu pengalaman pembeli
  }
}
