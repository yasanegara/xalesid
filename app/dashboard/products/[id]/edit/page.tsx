import { redirect, notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/current-tenant";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.tenantId !== tenant.id) notFound();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Edit landing page</h1>
        <a
          className="btn-primary"
          href={`/${tenant.slug}/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "#fff", border: "2px solid #111" }}
        >
          👁️ Lihat halaman
        </a>
      </div>
      <EditProductForm product={product} />
    </div>
  );
}
