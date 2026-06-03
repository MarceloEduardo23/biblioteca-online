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

type LoanWithRelations = PrismaLoan & {
  book: PrismaBook;
  user: PrismaUserPublic;
};

export function serializeLoan(loan: LoanWithRelations) {
  return {
    id: loan.id,
    bookId: loan.bookId,
    userId: loan.userId,
    loanDate: loan.loanDate.toISOString(),
    dueDate: loan.dueDate.toISOString(),
    returnDate: loan.returnDate ? loan.returnDate.toISOString() : undefined,
    pickedUpAt: loan.pickedUpAt ? loan.pickedUpAt.toISOString() : undefined,
    renewals: loan.renewals,
    status: loanStatus(loan),
    book: serializeBook(loan.book),
    user: serializeUser(loan.user),
  };
}
