import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageViewTracker from "./PageViewTracker";
import BuyButton from "./BuyButton";
import SocialProofPopup from "./SocialProofPopup";
import { darkenHex, radiusForPreset, googleFontHref } from "@/lib/style-utils";

type PainBlock = { type: "pain"; title?: string; points?: string[] };
type BenefitsBlock = { type: "benefits"; title?: string; points?: string[] };
type MechanismBlock = { type: "mechanism"; title?: string; steps?: { title: string; description: string }[] };
type GuaranteeBlock = { type: "guarantee"; text?: string };
type FaqBlock = { type: "faq"; items?: { q: string; a: string }[] };
type Block = PainBlock | BenefitsBlock | MechanismBlock | GuaranteeBlock | FaqBlock;

// URL-nya jadi: xales.id/nama-toko/nama-produk
export default async function ProductLandingPage({
  params,
}: {
  params: { tenant: string; product: string };
}) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: params.tenant } });
  if (!tenant) notFound();

  const product = await prisma.product.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: params.product } },
  });
  if (!product) notFound();

  // ── Hitung data scarcity, semuanya dari data asli ──
  const soldCount = await prisma.order.count({ where: { productId: product.id, paymentStatus: "paid" } });

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentViewers = await prisma.event.findMany({
    where: { productId: product.id, type: "page_view", createdAt: { gte: fiveMinAgo } },
    distinct: ["visitorId"],
    select: { visitorId: true },
  });
  const viewingNow = recentViewers.length;

  const stockRemaining = product.stockEnabled && product.stockQty !== null ? Math.max(product.stockQty - soldCount, 0) : null;
  const soldOut = product.stockEnabled && stockRemaining !== null && stockRemaining <= 0;

  const promoActive = !!product.promoPrice && (!product.promoEndsAt || product.promoEndsAt.getTime() > Date.now());
  const displayPrice = promoActive ? product.promoPrice! : product.price;

  const buyHref = `/${tenant.slug}/${product.slug}/checkout`;

  // ── Gaya visual: kalau produk punya warna/font sendiri, override gaya default xales.id ──
  const brandColor = product.brandColor || "#f2c200";
  const styleVars = {
    "--y": brandColor,
    "--yd": darkenHex(brandColor),
    "--radius": radiusForPreset(product.stylePreset),
    fontFamily: product.brandFont ? `"${product.brandFont}", "Plus Jakarta Sans", sans-serif` : undefined,
  } as React.CSSProperties;
  const fontHref = googleFontHref(product.brandFont);

  // ── Kalau AI udah nyusun struktur bebas, pakai itu. Kalau belum, pakai field manual biasa ──
  const aiSections: Block[] | null = product.landingBlocksJson ? JSON.parse(product.landingBlocksJson) : null;
  const heroTitle = product.aiHeadline || product.name;

  const benefitListManual: string[] = product.benefitPoints
    ? product.benefitPoints.split("\n").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const faqListManual: { q: string; a: string }[] = product.faqJson ? JSON.parse(product.faqJson) : [];

  return (
    <div style={styleVars}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <PageViewTracker productId={product.id} />
      {product.socialProofEnabled && <SocialProofPopup productId={product.id} />}

      <div className="lp-bar">
        {product.isPhysical ? "📦 Produk fisik · Dikirim setelah pembayaran" : "⚡ Produk digital · Langsung dikirim setelah bayar"}
      </div>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <span className="lp-tag">{tenant.name}</span>
          <h1 className="lp-title">{heroTitle}</h1>
          {product.description && <p className="lp-desc">{product.description}</p>}

          {product.photoUrl && <img src={product.photoUrl} alt={product.name} className="lp-photo" />}

          {(product.showSoldCount || product.showViewingNow || (product.stockEnabled && stockRemaining !== null)) && (
            <div className="lp-scarcity-row">
              {product.showSoldCount && soldCount > 0 && (
                <span className="lp-scarcity-badge">🔥 Sudah {soldCount} terjual</span>
              )}
              {product.showViewingNow && viewingNow > 0 && (
                <span className="lp-scarcity-badge">👀 {viewingNow} orang lagi lihat</span>
              )}
              {product.stockEnabled && stockRemaining !== null && (
                <span className={`lp-scarcity-badge ${stockRemaining <= 5 ? "urgent" : ""}`}>
                  {soldOut ? "Stok habis" : `📦 Sisa ${stockRemaining} stok`}
                </span>
              )}
            </div>
          )}

          <div className={`lp-card ${soldOut ? "lp-sold-out" : ""}`}>
            <div>
              {promoActive && <span className="lp-price-old">Rp {product.price.toLocaleString("id-ID")}</span>}
              <span className="lp-price">Rp {displayPrice.toLocaleString("id-ID")}</span>
            </div>
            <div className="lp-price-note">
              {product.isPhysical ? "Belum termasuk ongkir" : "Sekali bayar, akses seumur hidup"}
            </div>
            {soldOut ? (
              <div className="lp-btn" style={{ background: "#999" }}>
                Stok Habis
              </div>
            ) : (
              <BuyButton productId={product.id} href={buyHref} />
            )}
            <div className="lp-badge-row">
              <span>🔒 Pembayaran aman</span>
              <span>·</span>
              <span>{product.isPhysical ? "Dikirim ke alamat kamu" : "Download instan"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kalau AI udah nyusun struktur bebas, render itu ── */}
      {aiSections
        ? aiSections.map((block, i) => {
            if (block.type === "pain" && block.points?.length) {
              return (
                <section className="pp-section" style={{ background: "#111" }} key={i}>
                  <div className="pp-w">
                    <span className="pp-section-label">Sebelum lanjut</span>
                    <h2 className="pp-section-title" style={{ color: "#fff" }}>
                      {block.title}
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {block.points.map((p, j) => (
                        <div key={j} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                          <span style={{ color: "#ff6b6b", fontWeight: 900, fontSize: 18 }}>✗</span>
                          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }
            if (block.type === "benefits" && block.points?.length) {
              return (
                <section className="pp-section pp-benefits-section" key={i}>
                  <div className="pp-w">
                    <span className="pp-section-label">Yang kamu dapat</span>
                    <h2 className="pp-section-title">{block.title}</h2>
                    <ul className="pp-benefit-list" style={{ listStyle: "none" }}>
                      {block.points.map((p, j) => (
                        <li className="pp-benefit-item" key={j}>
                          <span className="pp-benefit-check">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            }
            if (block.type === "mechanism" && block.steps?.length) {
              return (
                <section className="pp-section" style={{ background: "#fff" }} key={i}>
                  <div className="pp-w">
                    <span className="pp-section-label" style={{ color: "#b8860b" }}>
                      Cara kerjanya
                    </span>
                    <h2 className="pp-section-title" style={{ color: "#111" }}>
                      {block.title}
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {block.steps.map((s, j) => (
                        <div key={j} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "#f7f5f0", borderRadius: 10, padding: "16px 18px" }}>
                          <div style={{ flexShrink: 0, width: 30, height: 30, background: "#f2c200", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>
                            {j + 1}
                          </div>
                          <div>
                            <b style={{ fontSize: 15 }}>{s.title}</b>
                            <p style={{ fontSize: 13.5, color: "#666", marginTop: 4, lineHeight: 1.5 }}>{s.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }
            if (block.type === "guarantee" && block.text) {
              return (
                <section className="pp-section pp-guarantee-section" key={i}>
                  <div className="pp-w">
                    <div className="pp-guarantee-card">
                      <div className="pp-guarantee-icon">🛡️</div>
                      <div className="pp-guarantee-text">{block.text}</div>
                    </div>
                  </div>
                </section>
              );
            }
            if (block.type === "faq" && block.items?.length) {
              return (
                <section className="pp-section pp-faq-section" key={i}>
                  <div className="pp-w">
                    <span className="pp-section-label" style={{ color: "#b8860b" }}>
                      Masih ragu?
                    </span>
                    <h2 className="pp-section-title" style={{ color: "#111" }}>
                      Pertanyaan yang sering ditanya
                    </h2>
                    {block.items.map((item, j) => (
                      <details className="pp-faq-item" key={j}>
                        <summary>{item.q}</summary>
                        <p>{item.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            }
            return null;
          })
        : (
          <>
            {benefitListManual.length > 0 && (
              <section className="pp-section pp-benefits-section">
                <div className="pp-w">
                  <span className="pp-section-label">Yang kamu dapat</span>
                  <h2 className="pp-section-title">Kenapa produk ini layak dibeli</h2>
                  <ul className="pp-benefit-list" style={{ listStyle: "none" }}>
                    {benefitListManual.map((point, i) => (
                      <li className="pp-benefit-item" key={i}>
                        <span className="pp-benefit-check">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
            {product.guaranteeText && (
              <section className="pp-section pp-guarantee-section">
                <div className="pp-w">
                  <div className="pp-guarantee-card">
                    <div className="pp-guarantee-icon">🛡️</div>
                    <div className="pp-guarantee-text">{product.guaranteeText}</div>
                  </div>
                </div>
              </section>
            )}
            {faqListManual.length > 0 && (
              <section className="pp-section pp-faq-section">
                <div className="pp-w">
                  <span className="pp-section-label" style={{ color: "#b8860b" }}>
                    Masih ragu?
                  </span>
                  <h2 className="pp-section-title" style={{ color: "#111" }}>
                    Pertanyaan yang sering ditanya
                  </h2>
                  {faqListManual.map((item, i) => (
                    <details className="pp-faq-item" key={i}>
                      <summary>{item.q}</summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      {/* ── PENUTUP ── */}
      <section className="pp-section pp-final-section">
        <div className="pp-w">
          <h2 className="pp-final-title">
            {soldOut ? "Stoknya habis dulu" : "Yuk, mulai sekarang"}
          </h2>
          {!soldOut && (
            <a href={buyHref} className="hp-btn">
              Beli Sekarang — Rp {displayPrice.toLocaleString("id-ID")} →
            </a>
          )}
        </div>
      </section>

      <footer className="pp-footer">
        {tenant.name} · dibuat dengan{" "}
        <a href="/" style={{ color: "#f2c200", textDecoration: "none" }}>
          xales.id
        </a>
      </footer>
    </div>
  );
}
