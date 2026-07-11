import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/current-tenant";

export async function GET(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId wajib diisi." }, { status: 400 });

  const job = await prisma.aiJob.findUnique({ where: { id: jobId } });
  if (!job || job.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Job gak ditemukan." }, { status: 404 });
  }

  if (job.status === "done") {
    return NextResponse.json({ status: "done", result: job.resultJson ? JSON.parse(job.resultJson) : null });
  }
  if (job.status === "failed") {
    return NextResponse.json({ status: "failed", error: job.errorText });
  }
  return NextResponse.json({ status: "pending" });
}
