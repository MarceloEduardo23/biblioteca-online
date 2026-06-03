import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

// Cadastro público — cria sempre um usuário "reader" (leitor).
// Usuários com função admin/bibliotecário são criados pelo painel de admin.
export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha nome, email e senha." }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "A senha deve ter ao menos 6 caracteres." }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma conta com esse email." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      password: await hashPassword(String(password)),
      role: "reader",
    },
  });

  await createSession(user.id);
  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
}
