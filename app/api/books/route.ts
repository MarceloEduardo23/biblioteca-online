import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { serializeBook } from "@/lib/serializers";

// GET /api/books — lista pública de livros (disponibilidade calculada na hora).
export async function GET() {
  const [books, activeLoans] = await Promise.all([
    prisma.book.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.loan.findMany({ where: { returnDate: null }, select: { bookId: true } }),
  ]);

  // Conta quantos empréstimos ativos cada livro tem.
  const active = new Map<string, number>();
  for (const l of activeLoans) {
    active.set(l.bookId, (active.get(l.bookId) ?? 0) + 1);
  }

  return NextResponse.json({
    books: books.map((b) => serializeBook(b, active.get(b.id) ?? 0)),
  });
}

// POST /api/books — cadastra um livro (apenas admin/bibliotecário).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const data = await req.json();
  const total = Number(data.totalCopies) || 1;
  const available = Math.min(Number(data.availableCopies ?? total), total);

  const book = await prisma.book.create({
    data: {
      title: String(data.title || "").trim(),
      author: String(data.author || "").trim(),
      cover: String(data.cover || "").trim(),
      genre: String(data.genre || "").trim(),
      isbn: String(data.isbn || "").trim(),
      description: String(data.description || ""),
      publishedYear: Number(data.publishedYear) || new Date().getFullYear(),
      totalCopies: total,
      availableCopies: Math.max(0, available),
      rating: Number(data.rating) || 0,
    },
  });

  return NextResponse.json({ book: serializeBook(book) }, { status: 201 });
}
