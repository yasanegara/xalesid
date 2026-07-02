import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/current-tenant";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1>Halo, {tenant.name}</h1>
          <p className="muted">Toko kamu: xales.id/{tenant.slug}</p>
        </div>
        <a className="btn-primary" href="/dashboard/products/new">
          + Produk baru
        </a>
      </div>

      <p style={{ marginBottom: 24 }}>
        <a href="/dashboard/settings/ai" style={{ fontSize: 13, color: "#666" }}>
          ⚙️ Pengaturan AI
        </a>
      </p>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada produk. Yuk bikin yang pertama.</p>
        </div>
      ) : (
        <div className="product-list">
          {products.map((p) => (
            <div className="product-item" key={p.id}>
              <div>
                <b>{p.name}</b>
                <div className="muted">Rp {p.price.toLocaleString("id-ID")}</div>
              </div>
              <span className={`product-badge ${p.isPhysical ? "physical" : ""}`}>
                {p.isPhysical ? "Fisik" : "Digital"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
