import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { serializeUser, publicUserSelect } from "@/lib/serializers";

// GET /api/users — lista usuários (somente admin).
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users: users.map(serializeUser) });
}

// POST /api/users — cria usuário com função (somente admin).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha nome, email e senha." }, { status: 400 });
  }

  const allowedRoles = ["admin", "librarian", "reader"];
  const finalRole = allowedRoles.includes(role) ? role : "reader";
  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com esse email." }, { status: 409 });
  }

  const created = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      password: await hashPassword(String(password)),
      role: finalRole,
    },
    select: publicUserSelect,
  });

  return NextResponse.json({ user: serializeUser(created) }, { status: 201 });
}
