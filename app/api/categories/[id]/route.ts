import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/categories/[id] — renomeia a categoria e atualiza os livros que a usam.
export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const { name } = await req.json();
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Informe o novo nome." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  const clash = await prisma.category.findUnique({ where: { name: trimmed } });
  if (clash && clash.id !== id) {
    return NextResponse.json({ error: "Já existe uma categoria com esse nome." }, { status: 409 });
  }

  // Mantém os livros consistentes: troca o gênero antigo pelo novo nome.
  await prisma.$transaction([
    prisma.book.updateMany({
      where: { genre: category.name },
      data: { genre: trimmed },
    }),
    prisma.category.update({ where: { id }, data: { name: trimmed } }),
  ]);

  return NextResponse.json({ category: { id, name: trimmed } });
}

// DELETE /api/categories/[id] — remove a categoria (os livros mantêm o texto atual).
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }
}
