import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

  return (
    <>
      <div className="lp-bar">
        {product.isPhysical ? "📦 Produk fisik · Dikirim setelah pembayaran" : "⚡ Produk digital · Langsung dikirim setelah bayar"}
      </div>

      <section className="lp-hero">
        <div className="lp-hero-inner">
          <span className="lp-tag">{tenant.name}</span>
          <h1 className="lp-title">{product.name}</h1>
          {product.description && <p className="lp-desc">{product.description}</p>}

          <div className="lp-card">
            <div className="lp-price">Rp {product.price.toLocaleString("id-ID")}</div>
            <div className="lp-price-note">
              {product.isPhysical ? "Belum termasuk ongkir" : "Sekali bayar, akses seumur hidup"}
            </div>
            <a className="lp-btn" href={`/${tenant.slug}/${product.slug}/checkout`}>
              Beli sekarang →
            </a>
            <div className="lp-badge-row">
              <span>🔒 Pembayaran aman</span>
              <span>·</span>
              <span>{product.isPhysical ? "Dikirim ke alamat kamu" : "Download instan"}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
