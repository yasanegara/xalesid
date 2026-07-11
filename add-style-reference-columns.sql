-- Jalankan ini di pgweb (tab Query)
ALTER TABLE "Product" ADD COLUMN "brandColor" TEXT;
ALTER TABLE "Product" ADD COLUMN "brandFont" TEXT;
ALTER TABLE "Product" ADD COLUMN "stylePreset" TEXT NOT NULL DEFAULT 'bold';
ALTER TABLE "Product" ADD COLUMN "referenceUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "referenceImageUrl" TEXT;
