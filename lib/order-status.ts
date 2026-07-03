import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

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
    include: { product: { include: { tenant: true } } },
  });
  if (!order) return null;

  const newStatus = mapMidtransStatus(transactionStatus, fraudStatus);
  if (!newStatus) return order;

  const wasAlreadyPaid = order.paymentStatus === "paid";

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: newStatus,
      paymentType: paymentType || order.paymentType,
      shippingStatus: order.product.isPhysical && newStatus === "paid" ? "belum_dikirim" : order.shippingStatus,
    },
    include: { product: { include: { tenant: true } } },
  });

  // Kirim notif Telegram/WA cuma sekali, pas transisi dari BELUM lunas jadi LUNAS
  // (biar gak dobel-dobel kalau status dicek berkali-kali)
  if (newStatus === "paid" && !wasAlreadyPaid) {
    const tenant = updated.product.tenant;
    const text = [
      `💰 Pesanan baru lunas!`,
      ``,
      `Produk: ${updated.product.name}`,
      `Pembeli: ${updated.buyerName}`,
      `Harga: Rp ${updated.product.price.toLocaleString("id-ID")}`,
      updated.product.isPhysical ? `Perlu dikirim: alamat ada di dashboard` : `Produk digital: link download otomatis terkirim`,
    ].join("\n");

    if (tenant.telegramChatId) {
      await sendTelegramMessage(tenant.telegramChatId, text);
    }
    if (tenant.waProvider === "fonnte" && tenant.waApiKey && tenant.waNotifyNumber) {
      await sendWhatsAppMessage(tenant.waApiKey, tenant.waNotifyNumber, text);
    }
  }

  return updated;
}
