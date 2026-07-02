import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <Link href="/dashboard" className="dash-sidebar-brand">
          xales.id
        </Link>
        <nav className="dash-sidebar-links">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/crm">CRM</Link>
          <Link href="/dashboard/settings/ai">AI</Link>
          <Link href="/dashboard/settings/payment">Pembayaran</Link>
          <Link href="/dashboard/settings/telegram">Telegram</Link>
          <a href="/api/auth/logout">Keluar</a>
        </nav>
      </aside>
      <div className="dash-content">{children}</div>
    </div>
  );
}
