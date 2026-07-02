import { prisma } from "@/lib/prisma";

// Ubah status transaksi Midtrans jadi status yang kita pakai di database
function mapMidtransStatus(transactionStatus: string, fraudStatus?: string): string | null {
  if (transactionStatus === "capture" && fraudStatus === "accept") return "paid";
  if (transactionStatus === "settlement") return "paid";
  if (transactionStatus === "pending") return "pending";
  if (["deny", "cancel", "expire"].includes(transactionStatus)) return "failed";
  if (["refund", "partial_refund"].includes(transactionStatus)) return "refund";
  return null;
}

export async function applyOrderStatusUpdate(
  orderCode: string,
  transactionStatus: string,
  fraudStatus?: string,
  paymentType?: string
) {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: { product: true },
  });
  if (!order) return null;

  const newStatus = mapMidtransStatus(transactionStatus, fraudStatus);
  if (!newStatus) return order;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: newStatus,
      paymentType: paymentType || order.paymentType,
      shippingStatus: order.product.isPhysical && newStatus === "paid" ? "belum_dikirim" : order.shippingStatus,
    },
    include: { product: true },
  });

  return updated;
}
