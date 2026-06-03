import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeBook } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

// POST /api/books/[id]/rate — qualquer usuário logado avalia o livro (1 a 5).
export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para avaliar." }, { status: 401 });
  }

  const { id } = await params;
  const { rating } = await req.json();
  const value = Number(rating);
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return NextResponse.json({ error: "Nota deve ser de 1 a 5." }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado." }, { status: 404 });
  }

  const updated = await prisma.book.update({
    where: { id },
    data: { rating: Math.round(value) },
  });
  return NextResponse.json({ book: serializeBook(updated) });
}
