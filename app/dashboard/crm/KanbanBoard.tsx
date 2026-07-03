"use client";

import { useState } from "react";

type OrderCard = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  paymentStatus: string;
  shippingStatus: string | null;
  createdAt: string;
  product: { name: string; price: number; isPhysical: boolean };
};

const COLUMNS: { key: string; title: string; match: (o: OrderCard) => boolean }[] = [
  { key: "leads", title: "Leads (belum bayar)", match: (o) => o.paymentStatus === "belum_bayar" },
  { key: "pending", title: "Menunggu bayar", match: (o) => o.paymentStatus === "pending" },
  {
    key: "paid",
    title: "Lunas",
    match: (o) => o.paymentStatus === "paid" && (!o.product.isPhysical || o.shippingStatus === "belum_dikirim" || !o.shippingStatus),
  },
  { key: "shipped", title: "Dikirim", match: (o) => o.paymentStatus === "paid" && o.shippingStatus === "dikirim" },
  { key: "done", title: "Selesai", match: (o) => o.paymentStatus === "paid" && o.shippingStatus === "selesai" },
];

export default function KanbanBoard({ initialOrders }: { initialOrders: OrderCard[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  function handleDrop(columnKey: string, orderId: string) {
    setDragOverCol(null);
    // Update tampilan langsung (optimistic), baru kirim ke server
    const target = COLUMNS.find((c) => c.key === columnKey);
    if (!target) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (columnKey === "leads") return { ...o, paymentStatus: "belum_bayar" };
        if (columnKey === "pending") return { ...o, paymentStatus: "pending" };
        if (columnKey === "paid") return { ...o, paymentStatus: "paid", shippingStatus: o.product.isPhysical ? "belum_dikirim" : null };
        if (columnKey === "shipped") return { ...o, paymentStatus: "paid", shippingStatus: "dikirim" };
        if (columnKey === "done") return { ...o, paymentStatus: "paid", shippingStatus: "selesai" };
        return o;
      })
    );

    fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column: columnKey }),
    }).catch(() => {});
  }

  return (
    <div className="kanban-wrap">
      {COLUMNS.map((col) => {
        const items = orders.filter(col.match);
        return (
          <div
            key={col.key}
            className={`kanban-col ${dragOverCol === col.key ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.key);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => {
              e.preventDefault();
              const orderId = e.dataTransfer.getData("text/plain");
              handleDrop(col.key, orderId);
            }}
          >
            <div className="kanban-col-title">
              <span>{col.title}</span>
              <span className="kanban-count">{items.length}</span>
            </div>

            {items.length === 0 && <div className="kanban-empty">Kosong</div>}

            {items.map((o) => (
              <div
                key={o.id}
                className="kanban-card"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
              >
                <b>{o.buyerName}</b>
                <div className="kc-meta">
                  {o.product.name}
                  <br />
                  Rp {o.product.price.toLocaleString("id-ID")} ·{" "}
                  {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                  <br />
                  {o.buyerPhone}
                </div>
                <a
                  href={`https://wa.me/${o.buyerPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    marginRight: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1e7a34",
                    border: "1.5px solid #1e7a34",
                    borderRadius: 6,
                    padding: "4px 8px",
                    textDecoration: "none",
                  }}
                >
                  💬 Chat WA
                </a>
                <a
                  href={`/dashboard/crm/chat/${encodeURIComponent(o.buyerPhone.replace(/[^0-9]/g, ""))}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#111",
                    border: "1.5px solid #111",
                    borderRadius: 6,
                    padding: "4px 8px",
                    textDecoration: "none",
                  }}
                >
                  🗨️ Chat di sini
                </a>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
