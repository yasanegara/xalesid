import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageViewTracker from "./PageViewTracker";
import BuyButton from "./BuyButton";
import SocialProofPopup from "./SocialProofPopup";
import { darkenHex, neuroBaseHex, radiusForPreset, googleFontHref } from "@/lib/style-utils";

type PointItem = string | { text: string; icon?: string };
type PainBlock = { type: "pain"; title?: string; points?: PointItem[] };
type BenefitsBlock = { type: "benefits"; title?: string; points?: PointItem[] };
type MechanismBlock = { type: "mechanism"; title?: string; steps?: { title: string; description: string }[] };
type StatsBlock = { type: "stats"; title?: string; items?: { value: string; label: string }[] };
type ComparisonBlock = { type: "comparison"; title?: string; leftLabel?: string; rightLabel?: string; rows?: { left: string; right: string }[] };
type StoryBlock = { type: "story"; title?: string; text?: string };
type ObjectionBlock = { type: "objection"; title?: string; text?: string };
type GuaranteeBlock = { type: "guarantee"; text?: string };
type FaqBlock = { type: "faq"; items?: { q: string; a: string }[] };
type Block =
  | PainBlock
  | BenefitsBlock
  | MechanismBlock
  | StatsBlock
  | ComparisonBlock
  | StoryBlock
  | ObjectionBlock
  | GuaranteeBlock
  | FaqBlock;

function pointText(p: PointItem) {
  return typeof p === "string" ? p : p.text;
}
function pointIcon(p: PointItem, fallback: string) {
  return typeof p === "string" ? fallback : p.icon || fallback;
}

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

  const brandColor = product.brandColor || "#f2c200";
  const stylePreset = ["brutal", "minimal", "playful", "glass", "neuro"].includes(product.stylePreset)
    ? product.stylePreset
    : "brutal";
  const styleVars = {
    "--y": brandColor,
    "--yd": darkenHex(brandColor),
    "--neuro-base": neuroBaseHex(brandColor),
    "--radius": radiusForPreset(stylePreset),
    fontFamily: product.brandFont ? `"${product.brandFont}", "Plus Jakarta Sans", sans-serif` : undefined,
  } as React.CSSProperties;
  const fontHref = googleFontHref(product.brandFont);

  const aiSections: Block[] | null = product.landingBlocksJson ? JSON.parse(product.landingBlocksJson) : null;
  const heroTitle = product.aiHeadline || product.name;

  const benefitListManual: string[] = product.benefitPoints
    ? product.benefitPoints.split("\n").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const faqListManual: { q: string; a: string }[] = product.faqJson ? JSON.parse(product.faqJson) : [];

  return (
    <div style={styleVars} className={`pp-style-${stylePreset}`}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <PageViewTracker productId={product.id} />
      {product.socialProofEnabled && <SocialProofPopup productId={product.id} />}

      <div className="lp-bar">
        {product.isPhysical ? "📦 Produk fisik · Dikirim setelah pembayaran" : "⚡ Produk digital · Langsung dikirim setelah bayar"}
      </div>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner pp-reveal">
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

      {aiSections
        ? aiSections.map((block, i) => {
            if (block.type === "pain" && block.points?.length) {
              return (
                <section className="pp-section pp-pain-section" key={i}>
                  <div className="pp-w pp-reveal">
                    <span className="pp-section-label">Sebelum lanjut</span>
                    <h2 className="pp-section-title">{block.title}</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {block.points.map((p, j) => (
                        <div className="pp-pain-item" key={j}>
                          <span className="pp-pain-x">{pointIcon(p, "✗")}</span>
                          <span className="pp-pain-text">{pointText(p)}</span>
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
                  <div className="pp-w pp-reveal">
                    <span className="pp-section-label">Yang kamu dapat</span>
                    <h2 className="pp-section-title">{block.title}</h2>
                    <ul className="pp-benefit-list" style={{ listStyle: "none" }}>
                      {block.points.map((p, j) => (
                        <li className="pp-benefit-item" key={j}>
                          <span className="pp-benefit-check">{pointIcon(p, "✓")}</span>
                          <span>{pointText(p)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            }
            if (block.type === "mechanism" && block.steps?.length) {
              return (
                <section className="pp-section pp-mechanism-section" key={i}>
                  <div className="pp-w pp-reveal">
                    <span className="pp-section-label" style={{ color: "#b8860b" }}>
                      Cara kerjanya
                    </span>
                    <h2 className="pp-section-title">{block.title}</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {block.steps.map((s, j) => (
                        <div className="pp-mechanism-step" key={j}>
                          <div className="pp-mechanism-num">{j + 1}</div>
                          <div>
                            <b>{s.title}</b>
                            <p>{s.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }
            if (block.type === "stats" && block.items?.length) {
              return (
                <section className="pp-section pp-stats-section" key={i}>
                  <div className="pp-w pp-reveal">
                    {block.title && <h2 className="pp-section-title">{block.title}</h2>}
                    <div className="pp-stats-grid">
                      {block.items.map((it, j) => (
                        <div className="pp-stat-card" key={j}>
                          <div className="pp-stat-value">{it.value}</div>
                          <div className="pp-stat-label">{it.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }
            if (block.type === "comparison" && block.rows?.length) {
              return (
                <section className="pp-section pp-comparison-section" key={i}>
                  <div className="pp-w pp-reveal">
                    {block.title && <h2 className="pp-section-title">{block.title}</h2>}
                    <div className="pp-comparison-table">
                      <div className="pp-comparison-head">
                        <div>{block.leftLabel || "Sebelum"}</div>
                        <div>{block.rightLabel || "Sesudah"}</div>
                      </div>
                      {block.rows.map((r, j) => (
                        <div className="pp-comparison-row" key={j}>
                          <div className="pp-comparison-left">✗ {r.left}</div>
                          <div className="pp-comparison-right">✓ {r.right}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }
            if (block.type === "story" && block.text) {
              return (
                <section className="pp-section pp-story-section" key={i}>
                  <div className="pp-w pp-reveal">
                    {block.title && <span className="pp-section-label">{block.title}</span>}
                    <p className="pp-story-text">{block.text}</p>
                  </div>
                </section>
              );
            }
            if (block.type === "objection" && block.text) {
              return (
                <section className="pp-section pp-objection-section" key={i}>
                  <div className="pp-w pp-reveal">
                    <div className="pp-objection-card">
                      {block.title && <b>{block.title}</b>}
                      <p>{block.text}</p>
                    </div>
                  </div>
                </section>
              );
            }
            if (block.type === "guarantee" && block.text) {
              return (
                <section className="pp-section pp-guarantee-section" key={i}>
                  <div className="pp-w pp-reveal">
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
                  <div className="pp-w pp-reveal">
                    <span className="pp-section-label" style={{ color: "#b8860b" }}>
                      Masih ragu?
                    </span>
                    <h2 className="pp-section-title">Pertanyaan yang sering ditanya</h2>
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
                <div className="pp-w pp-reveal">
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
                <div className="pp-w pp-reveal">
                  <div className="pp-guarantee-card">
                    <div className="pp-guarantee-icon">🛡️</div>
                    <div className="pp-guarantee-text">{product.guaranteeText}</div>
                  </div>
                </div>
              </section>
            )}
            {faqListManual.length > 0 && (
              <section className="pp-section pp-faq-section">
                <div className="pp-w pp-reveal">
                  <span className="pp-section-label" style={{ color: "#b8860b" }}>
                    Masih ragu?
                  </span>
                  <h2 className="pp-section-title">Pertanyaan yang sering ditanya</h2>
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

      <section className="pp-section pp-final-section">
        <div className="pp-w pp-reveal">
          <h2 className="pp-final-title">{soldOut ? "Stoknya habis dulu" : "Yuk, mulai sekarang"}</h2>
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

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  if (typeof IntersectionObserver === 'undefined') return;
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('pp-reveal-on'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.pp-reveal').forEach(function(el){ obs.observe(el); });
})();
`,
        }}
      />
    </div>
  );
}
