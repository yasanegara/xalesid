import { redirect, notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/current-tenant";
import { prisma } from "@/lib/prisma";

export default async function LeadsPage({ params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.tenantId !== tenant.id) notFound();

  const leads = await prisma.order.findMany({
    where: { productId: product.id, paymentStatus: "belum_bayar" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Leads: {product.name}</h1>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20, maxWidth: 480 }}>
        Orang-orang ini udah isi nama & nomor WA di halaman checkout, tapi belum sampai bayar. Cocok buat di-follow up manual.
      </p>

      {leads.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada data. Nanti otomatis muncul begitu ada yang mulai isi form checkout tapi belum bayar.</p>
        </div>
      ) : (
        <div className="product-list">
          {leads.map((l) => (
            <div className="product-item" key={l.id}>
              <div>
                <b>{l.buyerName}</b>
                <div className="muted">
                  {l.buyerPhone}
                  {l.buyerEmail ? ` · ${l.buyerEmail}` : ""}
                </div>
              </div>
              <a
                href={`https://wa.me/${l.buyerPhone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
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
                💬 Follow up
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
