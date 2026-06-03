import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { serializeLoan, publicUserSelect } from "@/lib/serializers";

const LOAN_DAYS = 14;

// GET /api/loans — admin/bibliotecário veem todos; leitores veem apenas os seus.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const loans = await prisma.loan.findMany({
    where: isStaff(user.role) ? {} : { userId: user.id },
    include: { book: true, user: { select: publicUserSelect } },
    orderBy: { loanDate: "desc" },
  });

  return NextResponse.json({ loans: loans.map(serializeLoan) });
}

// POST /api/loans — registra um empréstimo para o usuário logado e baixa 1 cópia.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json();
  const bookId = body?.bookId;
  if (!bookId) {
    return NextResponse.json({ error: "bookId é obrigatório." }, { status: 400 });
  }

  // Por padrão, o empréstimo é para o próprio usuário logado. Mas a equipe
  // (admin/bibliotecário) pode registrar em nome de um leitor — informando o
  // userId ou o email do leitor. Isso viabiliza o empréstimo via scanner.
  let borrowerId = user.id;
  if (isStaff(user.role) && (body.userId || body.userEmail)) {
    const target = body.userId
      ? await prisma.user.findUnique({ where: { id: String(body.userId) } })
      : await prisma.user.findUnique({
          where: { email: String(body.userEmail).toLowerCase().trim() },
        });
    if (!target) {
      return NextResponse.json({ error: "Leitor não encontrado." }, { status: 404 });
    }
    borrowerId = target.id;
  }

  try {
    // Transação: garante que a checagem de disponibilidade e a baixa da cópia
    // aconteçam juntas, evitando emprestar um livro indisponível.
    const loan = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error("NOT_FOUND");

      // Regra: uma cópia por usuário — bloqueia se o leitor já está com este livro.
      const alreadyHas = await tx.loan.count({
        where: { bookId, userId: borrowerId, returnDate: null },
      });
      if (alreadyHas > 0) throw new Error("ALREADY_BORROWED");

      // Disponibilidade real = total de cópias - empréstimos ativos do livro.
      const activeLoans = await tx.loan.count({
        where: { bookId, returnDate: null },
      });
      if (activeLoans >= book.totalCopies) throw new Error("UNAVAILABLE");

      const dueDate = new Date(Date.now() + LOAN_DAYS * 24 * 60 * 60 * 1000);
      return tx.loan.create({
        data: { bookId, userId: borrowerId, dueDate },
        include: { book: true, user: { select: publicUserSelect } },
      });
    });

    return NextResponse.json({ loan: serializeLoan(loan) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Livro não encontrado." }, { status: 404 });
    }
    if (message === "ALREADY_BORROWED") {
      return NextResponse.json(
        { error: "Este leitor já está com um exemplar deste livro." },
        { status: 409 }
      );
    }
    if (message === "UNAVAILABLE") {
      return NextResponse.json({ error: "Nenhuma cópia disponível." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar empréstimo." }, { status: 500 });
  }
}
