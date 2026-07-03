-- Jalankan ini di pgweb (tab Query)
ALTER TABLE "Product" ADD COLUMN "benefitPoints" TEXT;
ALTER TABLE "Product" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "guaranteeText" TEXT;
ALTER TABLE "Product" ADD COLUMN "faqJson" TEXT;
ALTER TABLE "Product" ADD COLUMN "stockEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "stockQty" INTEGER;
ALTER TABLE "Product" ADD COLUMN "showSoldCount" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "showViewingNow" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "promoPrice" INTEGER;
ALTER TABLE "Product" ADD COLUMN "promoEndsAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN "socialProofEnabled" BOOLEAN NOT NULL DEFAULT false;
