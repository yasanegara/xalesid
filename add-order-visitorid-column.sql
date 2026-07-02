-- Jalankan ini di pgweb (tab Query)
ALTER TABLE "Order" ADD COLUMN "visitorId" TEXT;
CREATE INDEX "Order_visitorId_productId_idx" ON "Order"("visitorId", "productId");
