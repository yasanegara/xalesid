import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/current-tenant";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "./KanbanBoard";

export default async function CRMPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { product: { tenantId: tenant.id } },
    include: { product: { select: { name: true, price: true, isPhysical: true } } },
    orderBy: { createdAt: "desc" },
  });

  const ordersForBoard = orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }));

  return (
    <div className="page-wrap" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>CRM — Semua Pesanan</h1>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
        Geser kartu ke kolom lain buat ubah status pesanan secara manual.
      </p>
      <KanbanBoard initialOrders={ordersForBoard} />
    </div>
  );
}
