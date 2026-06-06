export type UserRole = "admin" | "librarian" | "reader";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
}

export interface Slide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  isbn: string;
  description: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  rating: number;
}

export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  returnDate?: Date;
  pickedUpAt?: Date;
  reservationExpiresAt?: Date;
  renewals: number;
  status: "pending" | "active" | "returned" | "overdue";
  fine: number; // R$ acumulados por dias de atraso (R$1/dia)
}

export interface LoanWithDetails extends Loan {
  book: Book;
  user: User;
}

// ---------------------------------------------------------------------------
// Relatórios gerenciais (somente leitura) — agregados calculados no servidor
// a partir de Book/User/Loan. Ver lib/reports.ts e app/api/reports.
// ---------------------------------------------------------------------------

// Situação do acervo (livros e exemplares).
export interface AcervoReport {
  titulos: number;            // quantidade de títulos cadastrados
  exemplares: number;         // soma de todas as cópias (totalCopies)
  disponiveis: number;        // exemplares livres no momento
  emprestados: number;        // exemplares fora (empréstimo/reserva ativa)
  avaliacaoMedia: number;     // média das notas dos livros avaliados
  porGenero: { genero: string; titulos: number; exemplares: number }[];
  maisEmprestados: { id: string; title: string; author: string; total: number }[];
  nuncaEmprestados: { total: number; titulos: string[] };
}

// Situação dos usuários (leitores, bibliotecários e administradores).
export interface UsuariosReport {
  total: number;
  porPapel: { admin: number; librarian: number; reader: number };
  leitoresComEmprestimoAtivo: number;
  leitoresEmAtraso: number;
  multaEmAberto: number;      // R$ total de multas de leitores em atraso
  novosUltimos30Dias: number;
  maisAtivos: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    total: number;            // total de empréstimos no histórico
    emAtraso: number;         // empréstimos atualmente atrasados
  }[];
}

// Situação dos empréstimos.
export interface EmprestimosReport {
  total: number;
  porStatus: { pending: number; active: number; overdue: number; returned: number };
  multasAcumuladas: number;   // R$ das multas em aberto (status overdue)
  renovacoes: number;         // total de renovações registradas
  devolvidosNoPrazo: number;
  devolvidosComAtraso: number;
  taxaPontualidade: number;   // % de devoluções feitas dentro do prazo
  ultimos30Dias: number;      // empréstimos criados nos últimos 30 dias
}

export interface LibraryReport {
  generatedAt: string;        // ISO — quando o relatório foi gerado
  acervo: AcervoReport;
  usuarios: UsuariosReport;
  emprestimos: EmprestimosReport;
}
