export default function HomePage() {
  return (
    <>
      <div className="hp-bar">🚀 Daftar gratis · Gak perlu kartu kredit · Toko pertama aktif dalam 5 menit</div>

      {/* HERO */}
      <section className="hp-hero">
        <div className="hp-hero-inner">
          <div className="hp-hero-text">
            <span className="hp-tag">xales.id · Buat UMKM &amp; Kreator Digital</span>
            <h1 className="hp-h1">
              Jualan Online yang
              <br />
              Ngurus Dirinya Sendiri
            </h1>
            <p className="hp-deck">
              Landing page, checkout, pembayaran, kirim produk, sampai follow-up pembeli — semua jalan otomatis.
              Kamu tinggal fokus bikin produk yang bagus.
            </p>
            <a href="/register" className="hp-btn">
              Mulai Gratis Sekarang →
            </a>
            <p className="hp-sub-cta">Daftar 2 menit. Toko langsung bisa dipakai.</p>
          </div>
          <div className="hp-hero-photo">
            <img
              src="https://images.unsplash.com/photo-1755434613831-1a8cb00bfb2c?fm=jpg&q=80&w=900&auto=format&fit=crop"
              alt="Pelaku usaha yang jualan online pakai xales.id"
            />
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="hp-section hp-pain">
        <div className="hp-w">
          <span className="hp-label">Masalahnya</span>
          <h2 className="hp-h2">
            Kamu jualan.
            <br />
            Bukan ngurusin Excel
            <br />
            dan chat manual.
          </h2>

          <div className="hp-check">
            <span className="hp-check-x">✗</span>
            <span className="hp-check-text">Tiap ada yang nanya harga atau minta link bayar, kamu bales satu-satu manual di WA.</span>
          </div>
          <div className="hp-check">
            <span className="hp-check-x">✗</span>
            <span className="hp-check-text">Yang udah transfer susah dilacak. Yang belum bayar juga kelupaan di-follow up.</span>
          </div>
          <div className="hp-check">
            <span className="hp-check-x">✗</span>
            <span className="hp-check-text">Mau bikin landing page produk baru? Order jasa desain lagi, nunggu lagi, bayar lagi.</span>
          </div>
          <div className="hp-check">
            <span className="hp-check-x">✗</span>
            <span className="hp-check-text">Udah jualan beberapa produk, tapi gak tau produk mana yang orang paling banyak lihat lalu kabur.</span>
          </div>

          <div className="hp-pain-line">
            Bukan kamu yang kurang niat jualan.
            <br />
            Sistem jualannya aja yang masih dikerjain manual semua.
          </div>
        </div>
      </section>

      {/* MECHANISM */}
      <section className="hp-section" style={{ background: "#fff" }}>
        <div className="hp-w">
          <span className="hp-label" style={{ color: "#b8860b" }}>
            Solusinya
          </span>
          <h2 className="hp-h2" style={{ color: "#111" }}>
            Satu sistem, dari toko
            <br />
            dibuka sampai duit masuk.
          </h2>

          <div className="hp-steps">
            <div className="hp-step">
              <div className="hp-step-n">1</div>
              <div>
                <h3>Bikin produk</h3>
                <p>Isi nama, harga, upload file atau tandai produk fisik. Selesai dalam 2 menit.</p>
              </div>
            </div>
            <div className="hp-step">
              <div className="hp-step-n">2</div>
              <div>
                <h3>Landing page otomatis jadi</h3>
                <p>Desain udah siap. Deskripsi produk bisa dibikinin AI, tinggal klik.</p>
              </div>
            </div>
            <div className="hp-step">
              <div className="hp-step-n">3</div>
              <div>
                <h3>Pembeli checkout &amp; bayar sendiri</h3>
                <p>QRIS, transfer bank, kartu — semua metode pembayaran Midtrans aktif otomatis.</p>
              </div>
            </div>
            <div className="hp-step">
              <div className="hp-step-n">4</div>
              <div>
                <h3>Kamu tinggal terima kabar</h3>
                <p>Produk digital terkirim sendiri ke pembeli. Kamu dapat notif Telegram tiap ada penjualan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFER / VALUE STACK */}
      <section className="hp-section hp-offer">
        <div className="hp-w">
          <h2 className="hp-h2" style={{ color: "#111", textAlign: "center" }}>
            Semua yang kamu butuh
            <br />
            buat jualan online, jadi satu.
          </h2>

          <div className="hp-offer-card">
            <div className="hp-offer-title">Yang kamu dapat begitu daftar</div>
            <ul className="hp-offer-list">
              <li>Landing page otomatis buat tiap produk</li>
              <li>AI bantu nulisin deskripsi produk</li>
              <li>Checkout + semua metode pembayaran Midtrans</li>
              <li>Produk digital terkirim otomatis, gak perlu pegang HP 24 jam</li>
              <li>Notifikasi real-time ke Telegram tiap ada penjualan</li>
              <li>CRM Kanban buat pantau semua pesanan dalam 1 papan</li>
              <li>Data orang yang isi form tapi belum bayar, biar bisa di-follow up</li>
              <li>Laporan funnel: tau persis di mana orang berhenti sebelum beli</li>
            </ul>
            <a href="/register" className="hp-btn" style={{ display: "block", textAlign: "center", boxShadow: "none" }}>
              Daftar Gratis →
            </a>
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="hp-section" style={{ background: "#fff", paddingTop: 60, paddingBottom: 60 }}>
        <div className="hp-w" style={{ maxWidth: 560 }}>
          <div className="hp-guarantee">
            <b>🔒 Kamu yang pegang kendali, bukan kami</b>
            <p>
              Daftar gratis, gak perlu kartu kredit. Kunci pembayaran dan AI yang kamu pakai adalah punya kamu sendiri —
              bukan titipan ke platform. Uang hasil jualan langsung masuk ke rekening kamu lewat Midtrans, gak lewat kami dulu.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="hp-final">
        <h2>
          Mulai dari sini.
        </h2>
        <p>Bukan dari nambah kerjaan manual. Dari sistem yang jualan sambil kamu tidur.</p>
        <a href="/register" className="hp-btn">
          Daftar Gratis Sekarang →
        </a>
      </section>

      <footer className="hp-footer">© 2026 xales.id · Dibangun buat UMKM &amp; kreator digital Indonesia</footer>
    </>
  );
}
