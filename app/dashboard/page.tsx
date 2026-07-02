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

  // Hitung berapa pesanan lunas per produk, buat statistik pendapatan
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: "paid", product: { tenantId: tenant.id } },
    select: { productId: true },
  });
  const paidCountByProduct: Record<string, number> = {};
  for (const o of paidOrders) {
    paidCountByProduct[o.productId] = (paidCountByProduct[o.productId] || 0) + 1;
  }
  const totalRevenue = products.reduce((sum, p) => sum + (paidCountByProduct[p.id] || 0) * p.price, 0);
  const totalPaidOrders = paidOrders.length;

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

      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ background: "#111", color: "#fff", borderRadius: 10, padding: "16px 20px", flex: "1 1 200px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#f2c200", textTransform: "uppercase", marginBottom: 6 }}>
            Total pendapatan
          </div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Rp {totalRevenue.toLocaleString("id-ID")}</div>
        </div>
        <div style={{ background: "#111", color: "#fff", borderRadius: 10, padding: "16px 20px", flex: "1 1 200px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#f2c200", textTransform: "uppercase", marginBottom: 6 }}>
            Pesanan lunas
          </div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{totalPaidOrders}</div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada produk. Yuk bikin yang pertama.</p>
        </div>
      ) : (
        <div className="product-list">
          {products.map((p) => {
            const soldCount = paidCountByProduct[p.id] || 0;
            const revenue = soldCount * p.price;
            return (
              <div className="product-item" key={p.id}>
                <div>
                  <b>{p.name}</b>
                  <div className="muted">
                    Rp {p.price.toLocaleString("id-ID")} · Terjual {soldCount} · Pendapatan Rp {revenue.toLocaleString("id-ID")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className={`product-badge ${p.isPhysical ? "physical" : ""}`}>
                    {p.isPhysical ? "Fisik" : "Digital"}
                  </span>
                  <a
                    href={`/dashboard/products/${p.id}/leads`}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111",
                      border: "1.5px solid #111",
                      borderRadius: 6,
                      padding: "5px 10px",
                      textDecoration: "none",
                    }}
                  >
                    🎯 Leads
                  </a>
                  <a
                    href={`/dashboard/products/${p.id}/funnel`}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111",
                      border: "1.5px solid #111",
                      borderRadius: 6,
                      padding: "5px 10px",
                      textDecoration: "none",
                    }}
                  >
                    📊 Funnel
                  </a>
                  <a
                    href={`/dashboard/products/${p.id}/edit`}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111",
                      border: "1.5px solid #111",
                      borderRadius: 6,
                      padding: "5px 10px",
                      textDecoration: "none",
                    }}
                  >
                    🎨 Landing page
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
