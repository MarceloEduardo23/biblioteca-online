// Converte os registros do banco para o formato consumido pelo frontend.
// O "status" do empréstimo é calculado dinamicamente (não fica salvo no banco):
//   - tem returnDate           -> "returned" (devolvido)
//   - venceu e não devolveu     -> "overdue"  (atrasado)
//   - caso contrário            -> "active"   (ativo)
import type { Book as PrismaBook, User as PrismaUser, Loan as PrismaLoan } from "@prisma/client";

type PrismaUserPublic = Omit<PrismaUser, "password">;

// Campos públicos do usuário (tudo, menos a senha). Reutilizado nas queries Prisma.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export function serializeBook(book: PrismaBook, activeLoans?: number) {
  // A disponibilidade é DERIVADA: total de cópias menos empréstimos ativos.
  // Quando activeLoans não é informado, cai no valor armazenado (ex.: livro novo).
  const availableCopies =
    activeLoans === undefined
      ? book.availableCopies
      : Math.max(0, book.totalCopies - activeLoans);
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover: book.cover,
    genre: book.genre,
    isbn: book.isbn,
    description: book.description,
    publishedYear: book.publishedYear,
    totalCopies: book.totalCopies,
    availableCopies,
    rating: book.rating,
  };
}

export function serializeUser(user: PrismaUserPublic) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function loanStatus(
  loan: Pick<PrismaLoan, "returnDate" | "dueDate" | "pickedUpAt">
) {
  if (loan.returnDate) return "returned" as const;
  if (!loan.pickedUpAt) return "pending" as const; // aguardando retirada (escaneamento)
  if (loan.dueDate.getTime() < Date.now()) return "overdue" as const;
  return "active" as const;
}

// Dias de atraso entre dueDate e uma data de referência (0 se não está atrasado).
export function computeOverdueDays(dueDate: Date, reference: Date = new Date()): number {
  if (dueDate.getTime() >= reference.getTime()) return 0;
  return Math.ceil((reference.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
}

type LoanWithRelations = PrismaLoan & {
  book: PrismaBook;
  user: PrismaUserPublic;
};

export function serializeLoan(loan: LoanWithRelations) {
  const status = loanStatus(loan);
  const fine = status === "overdue" ? computeOverdueDays(loan.dueDate) : 0;
  return {
    id: loan.id,
    bookId: loan.bookId,
    userId: loan.userId,
    loanDate: loan.loanDate.toISOString(),
    dueDate: loan.dueDate.toISOString(),
    returnDate: loan.returnDate ? loan.returnDate.toISOString() : undefined,
    pickedUpAt: loan.pickedUpAt ? loan.pickedUpAt.toISOString() : undefined,
    reservationExpiresAt:
      !loan.pickedUpAt && !loan.returnDate
        ? new Date(
            loan.loanDate.getTime() + 30 * 60 * 1000
          ).toISOString()
        : undefined,
    renewals: loan.renewals,
    status,
    fine,
    book: serializeBook(loan.book),
    user: serializeUser(loan.user),
  };
}
