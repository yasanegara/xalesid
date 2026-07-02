"use client";

import { useEffect, useState } from "react";

type Context = {
  product: { name: string; price: number; isPhysical: boolean };
  paymentReady: boolean;
  midtransClientKey: string;
  midtransIsProd: boolean;
};

export default function CheckoutPage({ params }: { params: { tenant: string; product: string } }) {
  const [ctx, setCtx] = useState<Context | null>(null);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [scriptReady, setScriptReady] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { paid: boolean; pending: boolean; digitalFileUrl: string | null; isPhysical: boolean }>(null);

  useEffect(() => {
    fetch(`/api/checkout/context?tenant=${params.tenant}&product=${params.product}`)
      .then((r) => r.json())
      .then((data) => {
        setCtx(data);
        setLoadingCtx(false);

        if (data.paymentReady && data.midtransClientKey) {
          const script = document.createElement("script");
          script.src = data.midtransIsProd
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js";
          script.setAttribute("data-client-key", data.midtransClientKey);
          script.onload = () => setScriptReady(true);
          document.body.appendChild(script);
        }
      })
      .catch(() => setLoadingCtx(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: params.tenant,
          productSlug: params.product,
          buyerName,
          buyerEmail,
          buyerPhone,
          shippingAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyiapkan pembayaran.");
        return;
      }

      const snap = (window as any).snap;
      snap.pay(data.token, {
        onSuccess: () => checkStatus(data.orderCode),
        onPending: () => checkStatus(data.orderCode),
        onError: () => setError("Pembayaran gagal. Coba lagi."),
        onClose: () => setError("Kamu menutup jendela pembayaran sebelum selesai."),
      });
    } catch {
      setError("Gagal terhubung ke server. Coba lagi sebentar.");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus(orderCode: string) {
    const res = await fetch("/api/checkout/check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode }),
    });
    const data = await res.json();
    setDone(data);
  }

  if (loadingCtx) return <div className="co-wrap">Memuat...</div>;
  if (!ctx) return <div className="co-wrap">Produk gak ditemukan.</div>;

  if (done) {
    return (
      <div className="co-thanks">
        <div className="co-thanks-card">
          <div style={{ fontSize: 44, marginBottom: 12 }}>{done.paid ? "🎉" : "⏳"}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
            {done.paid ? "Pembayaran berhasil!" : "Pesanan diterima"}
          </h1>
          {done.paid && done.digitalFileUrl && (
            <>
              <p style={{ marginBottom: 16 }}>Produk kamu udah siap, klik tombol di bawah buat download:</p>
              <a className="btn-primary" href={done.digitalFileUrl} target="_blank" rel="noopener noreferrer">
                ⬇ Download sekarang
              </a>
            </>
          )}
          {done.paid && done.isPhysical && <p>Pesanan kamu bakal segera diproses dan dikirim ke alamat yang kamu isi.</p>}
          {!done.paid && <p>Pembayaran kamu masih diproses. Halaman ini bisa ditutup, kamu akan dihubungi lewat email begitu lunas.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="co-wrap">
      <div className="co-card">
        <div className="co-summary">
          <div className="name">{ctx.product.name}</div>
          <div className="price">Rp {ctx.product.price.toLocaleString("id-ID")}</div>
        </div>

        {!ctx.paymentReady ? (
          <p style={{ color: "#9c0006" }}>Toko ini belum mengaktifkan pembayaran. Coba lagi nanti.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Nama lengkap</label>
              <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>Email (link download dikirim ke sini)</label>
              <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>Nomor WhatsApp</label>
              <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} required />
            </div>
            {ctx.product.isPhysical && (
              <div className="auth-field">
                <label>Alamat pengiriman</label>
                <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required />
              </div>
            )}
            {error && <div className="auth-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading || !scriptReady} style={{ width: "100%" }}>
              {loading ? "Menyiapkan..." : !scriptReady ? "Memuat pembayaran..." : "Bayar sekarang →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
