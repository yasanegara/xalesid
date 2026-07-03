import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageViewTracker from "./PageViewTracker";
import BuyButton from "./BuyButton";
import SocialProofPopup from "./SocialProofPopup";

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

  const benefitList = product.benefitPoints
    ? product.benefitPoints.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
  const faqList: { q: string; a: string }[] = product.faqJson ? JSON.parse(product.faqJson) : [];

  return (
    <>
      <PageViewTracker productId={product.id} />
      {product.socialProofEnabled && <SocialProofPopup productId={product.id} />}

      <div className="lp-bar">
        {product.isPhysical ? "📦 Produk fisik · Dikirim setelah pembayaran" : "⚡ Produk digital · Langsung dikirim setelah bayar"}
      </div>

      <section className="lp-hero">
        <div className="lp-hero-inner">
          <span className="lp-tag">{tenant.name}</span>
          <h1 className="lp-title">{product.name}</h1>
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
              <BuyButton productId={product.id} href={`/${tenant.slug}/${product.slug}/checkout`} />
            )}
            <div className="lp-badge-row">
              <span>🔒 Pembayaran aman</span>
              <span>·</span>
              <span>{product.isPhysical ? "Dikirim ke alamat kamu" : "Download instan"}</span>
            </div>
          </div>

          {benefitList.length > 0 && (
            <ul className="lp-benefits">
              {benefitList.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          )}

          {product.guaranteeText && <div className="lp-guarantee-box">🛡️ {product.guaranteeText}</div>}

          {faqList.length > 0 && (
            <div className="lp-faq">
              {faqList.map((item, i) => (
                <details key={i}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
