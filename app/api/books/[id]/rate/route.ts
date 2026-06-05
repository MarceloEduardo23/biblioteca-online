import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeBook } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ rating: null });

  const { id } = await params;
  const existing = await prisma.rating.findUnique({
    where: { bookId_userId: { bookId: id, userId: user.id } },
  });
  return NextResponse.json({ rating: existing?.value ?? null });
}

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

  const loan = await prisma.loan.findFirst({
    where: { bookId: id, userId: user.id, returnDate: { not: null } },
  });
  if (!loan) {
    return NextResponse.json(
      { error: "Você só pode avaliar livros que já devolveu." },
      { status: 403 }
    );
  }

  await prisma.rating.upsert({
    where: { bookId_userId: { bookId: id, userId: user.id } },
    create: { bookId: id, userId: user.id, value },
    update: { value },
  });

  const { _avg } = await prisma.rating.aggregate({
    where: { bookId: id },
    _avg: { value: true },
  });
  const newRating = Math.round((_avg.value ?? 0) * 10) / 10;

  const updated = await prisma.book.update({
    where: { id },
    data: { rating: newRating },
  });
  return NextResponse.json({ book: serializeBook(updated) });
}
