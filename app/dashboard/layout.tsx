import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/dashboard" className="dash-nav-brand">
            xales.id
          </Link>
          <div className="dash-nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/crm">CRM</Link>
            <Link href="/dashboard/settings/ai">AI</Link>
            <Link href="/dashboard/settings/payment">Pembayaran</Link>
            <Link href="/dashboard/settings/telegram">Telegram</Link>
            <a href="/api/auth/logout">Keluar</a>
          </div>
        </div>
      </nav>
      {children}
    </>
  );
}
