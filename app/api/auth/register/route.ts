import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }

  const existing = await prisma.tenant.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email ini sudah terdaftar." }, { status: 409 });
  }

  // Slug dasar dari nama, kalau sudah dipakai tambahin angka di belakang
  let slug = toSlug(name);
  let suffix = 0;
  while (await prisma.tenant.findUnique({ where: { slug: suffix ? `${slug}-${suffix}` : slug } })) {
    suffix += 1;
  }
  if (suffix) slug = `${slug}-${suffix}`;

  const tenant = await prisma.tenant.create({
    data: { name, email, slug, passwordHash: await hashPassword(password) },
  });

  const token = await createSession(tenant.id);
  const res = NextResponse.json({ id: tenant.id, slug: tenant.slug });
  res.cookies.set("session", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
