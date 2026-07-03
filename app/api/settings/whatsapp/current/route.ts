import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  return NextResponse.json({
    waProvider: tenant.waProvider,
    hasApiKey: !!tenant.waApiKey,
    waNotifyNumber: tenant.waNotifyNumber || "",
    tenantId: tenant.id,
  });
}
