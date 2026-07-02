import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { email } });
  if (!tenant || !(await verifyPassword(password, tenant.passwordHash))) {
    // Pesan error disamakan biar orang gak bisa nebak "email ada tapi password salah" vs "email gak ada"
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }

  const token = await createSession(tenant.id);
  const res = NextResponse.json({ id: tenant.id, slug: tenant.slug });
  res.cookies.set("session", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
