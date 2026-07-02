import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const token = cookies().get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect("/login");

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant) redirect("/login");

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Halo, {tenant.name}</h1>
      <p>Toko kamu: xales.id/{tenant.slug}</p>
      <p>Belum ada produk. Fitur "Bikin produk" nyusul di langkah berikutnya.</p>
    </main>
  );
}
