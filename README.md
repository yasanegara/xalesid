# xales.id

SaaS jualan produk digital & fisik: landing page otomatis, checkout, pembayaran,
pengiriman produk digital otomatis, notifikasi Telegram/WA, dan dashboard funnel —
per tenant (per user).

## Stack

- **Next.js** — landing page, checkout, dashboard dalam satu project
- **Railway** — hosting + database Postgres jadi satu tempat
- **Prisma** — ORM ke database, skema ada di `prisma/schema.prisma`
- **Midtrans** — payment gateway (MVP: tiap tenant pakai key Midtrans miliknya sendiri)
- **Telegram Bot API** — notifikasi otomatis ke pemilik toko saat ada order baru
- **Auth sendiri** — login pakai email/password (bcrypt) + sesi JWT, gak pakai layanan pihak ketiga
- **File produk digital** — MVP pakai link Google Drive dulu (isi manual pas bikin produk), belum perlu layanan storage terpisah

## Struktur data (lihat prisma/schema.prisma)

- `Tenant` — 1 baris = 1 user/toko, nyimpen slug URL, kredensial Midtrans, chat ID Telegram
- `Product` — produk yang dijual, tandai `isPhysical` kalau butuh dikirim manual
- `Order` — 1 transaksi, status bayar & status kirim
- `Event` — 1 catatan funnel (page_view, cta_click, checkout_start, payment_success)

## Yang perlu kamu siapkan sendiri di luar sandbox ini

1. **Bikin akun GitHub** (kalau belum ada) dan bikin 1 repo kosong buat xales.id
2. **Bikin project di Railway** (railway.app) → tambahkan service Postgres → ambil `DATABASE_URL` dari tab Connect, isi ke `.env`
3. **Bikin akun Midtrans** (sandbox dulu buat testing) di dashboard.midtrans.com
4. **Bikin bot Telegram**: chat `@BotFather` di Telegram → `/newbot` → dapat `TELEGRAM_BOT_TOKEN`, isi ke `.env`
5. **Deploy ke Railway**: hubungkan repo GitHub kamu ke Railway (New Project > Deploy from GitHub repo), Railway otomatis build & jalanin
6. **Arahkan domain xales.id**: di Railway > service kamu > Settings > Domains > Custom Domain, masukkan `xales.id`, lalu tambahkan DNS record (CNAME) sesuai instruksi Railway di panel domain kamu

## Push project ini ke GitHub

Download dulu semua file yang saya buat, taruh dalam satu folder `xales-id` di komputer kamu. Buat juga file `.gitignore` (sudah saya siapkan di bawah), lalu jalankan di terminal:

```bash
cd xales-id
git init
git add .
git commit -m "Initial scaffold xales.id"
git branch -M main
git remote add origin https://github.com/USERNAME-KAMU/xales-id.git
git push -u origin main
```

Ganti `USERNAME-KAMU` dengan username GitHub kamu, dan pastikan repo `xales-id` di GitHub sudah dibuat lebih dulu (kosong, tanpa README/gitignore/license — biar gak bentrok pas push pertama).

```bash
npm install
npx prisma generate
npx prisma db push   # bikin tabel-tabel di Supabase sesuai schema.prisma
npm run dev
```

## Status pembangunan

- [x] Skema database multi-tenant
- [ ] Auth + onboarding (bikin akun, bikin produk pertama)
- [ ] Landing page dinamis per produk
- [ ] Form checkout + integrasi Midtrans Snap
- [ ] Webhook Midtrans → update status, kirim produk digital otomatis
- [ ] Dashboard admin (daftar order, tandai kirim manual utk produk fisik)
- [ ] Event tracking (page_view, cta_click, checkout_start, payment_success)
- [ ] Notifikasi Telegram otomatis
- [ ] Notifikasi WA (opsional, pakai gateway pihak ketiga)
