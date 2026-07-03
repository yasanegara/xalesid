-- Jalankan ini di pgweb (tab Query)
ALTER TABLE "Tenant" ADD COLUMN "waProvider" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Tenant" ADD COLUMN "waApiKey" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "waNotifyNumber" TEXT;
