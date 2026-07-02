-- Jalankan ini di pgweb (tab Query)
ALTER TABLE "Tenant" ADD COLUMN "aiTokensUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tenant" ADD COLUMN "aiTokenLimit" INTEGER NOT NULL DEFAULT 25000;
