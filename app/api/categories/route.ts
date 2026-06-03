import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";

// GET /api/categories — lista pública (usada para popular os seletores).
export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
  });
}

// POST /api/categories — cria uma categoria (admin/bibliotecário).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { name } = await req.json();
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Informe o nome da categoria." }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { name: trimmed } });
  if (existing) {
    return NextResponse.json({ error: "Essa categoria já existe." }, { status: 409 });
  }

  const category = await prisma.category.create({ data: { name: trimmed } });
  return NextResponse.json(
    { category: { id: category.id, name: category.name } },
    { status: 201 }
  );
}
