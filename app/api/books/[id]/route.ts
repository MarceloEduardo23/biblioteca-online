import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { serializeBook } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/books/[id] — edita um livro (admin/bibliotecário).
export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const data = await req.json();

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = String(data.title).trim();
  if (data.author !== undefined) updateData.author = String(data.author).trim();
  if (data.cover !== undefined) updateData.cover = String(data.cover).trim();
  if (data.genre !== undefined) updateData.genre = String(data.genre).trim();
  if (data.isbn !== undefined) updateData.isbn = String(data.isbn).trim();
  if (data.description !== undefined) updateData.description = String(data.description);
  if (data.publishedYear !== undefined) updateData.publishedYear = Number(data.publishedYear);
  if (data.totalCopies !== undefined) updateData.totalCopies = Number(data.totalCopies);
  if (data.availableCopies !== undefined) updateData.availableCopies = Number(data.availableCopies);
  if (data.rating !== undefined) updateData.rating = Number(data.rating);

  try {
    const book = await prisma.book.update({ where: { id }, data: updateData });
    return NextResponse.json({ book: serializeBook(book) });
  } catch {
    return NextResponse.json({ error: "Livro não encontrado." }, { status: 404 });
  }
}

// DELETE /api/books/[id] — remove um livro (admin/bibliotecário).
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Livro não encontrado." }, { status: 404 });
  }
}
