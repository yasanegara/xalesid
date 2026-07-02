-- Jalankan ini di pgweb (tab Query), SETELAH tabel Tenant sudah ada
ALTER TABLE "Tenant" ADD COLUMN "aiProvider" TEXT NOT NULL DEFAULT 'anthropic';
ALTER TABLE "Tenant" ADD COLUMN "aiApiKey" TEXT;
