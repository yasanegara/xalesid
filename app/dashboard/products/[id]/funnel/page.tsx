"use client";

import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  page_view: "Buka landing page",
  cta_click: "Klik tombol beli",
  checkout_start: "Mulai isi checkout",
  payment_success: "Bayar berhasil",
};

export default function FunnelPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<{ productName: string; counts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${params.id}/funnel`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="page-wrap">Memuat...</div>;
  if (!data || !data.counts) return <div className="page-wrap">Gagal memuat data funnel.</div>;

  const stages = ["page_view", "cta_click", "checkout_start", "payment_success"];
  const base = data.counts.page_view || 0;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Funnel: {data.productName}</h1>
      </div>

      <div className="card-form" style={{ maxWidth: 520 }}>
        {stages.map((stage, i) => {
          const count = data.counts[stage] || 0;
          const pct = base > 0 ? Math.round((count / base) * 100) : 0;
          const widthPct = base > 0 ? Math.max((count / base) * 100, count > 0 ? 4 : 0) : 0;
          return (
            <div key={stage} style={{ marginBottom: i === stages.length - 1 ? 0 : 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 700 }}>{LABELS[stage]}</span>
                <span>
                  {count} orang {i > 0 && base > 0 && <span style={{ color: "#666" }}>({pct}%)</span>}
                </span>
              </div>
              <div style={{ background: "#f0ede3", borderRadius: 6, height: 10, overflow: "hidden" }}>
                <div style={{ width: `${widthPct}%`, background: "#f2c200", height: "100%", borderRadius: 6 }} />
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "#666", marginTop: 16, maxWidth: 480 }}>
        Persentase dihitung dari jumlah orang yang buka landing page. Dihitung per pengunjung unik, jadi 1 orang yang buka
        berkali-kali tetap dihitung 1.
      </p>
    </div>
  );
}
