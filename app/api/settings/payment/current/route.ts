import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  return NextResponse.json({
    midtransClientKey: tenant.midtransClientKey || "",
    midtransIsProd: tenant.midtransIsProd,
    hasServerKey: !!tenant.midtransServerKey,
  });
}
