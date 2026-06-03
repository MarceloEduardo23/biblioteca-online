import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Informe email e senha." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
  });

  if (!user || !(await verifyPassword(String(password), user.password))) {
    return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: serializeUser(user) });
}
