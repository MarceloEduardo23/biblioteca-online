// Serviço de relatórios gerenciais (somente leitura).
// Agrega os dados de Book/User/Loan em números úteis para o admin.
// Reusa loanStatus/computeOverdueDays para manter a MESMA regra de status e
// multa (R$1/dia) usada no resto do sistema (ver lib/serializers.ts).
import { prisma } from "./prisma";
import { loanStatus, computeOverdueDays } from "./serializers";
import type {
  LibraryReport,
  AcervoReport,
  UsuariosReport,
  EmprestimosReport,
  UserRole,
} from "./types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Monta o relatório completo. O volume de dados de uma biblioteca é pequeno,
// então calculamos em memória (mesmo estilo dos serializers) para reusar as
// regras de negócio já existentes sem duplicá-las em SQL.
export async function buildLibraryReport(): Promise<LibraryReport> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS);

  const [books, users, loans] = await Promise.all([
    prisma.book.findMany({ orderBy: { title: "asc" } }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.loan.findMany(),
  ]);

  // Índices auxiliares -------------------------------------------------------
  const loansByBook = new Map<string, typeof loans>();
  const loansByUser = new Map<string, typeof loans>();
  for (const loan of loans) {
    (loansByBook.get(loan.bookId) ?? loansByBook.set(loan.bookId, []).get(loan.bookId)!).push(loan);
    (loansByUser.get(loan.userId) ?? loansByUser.set(loan.userId, []).get(loan.userId)!).push(loan);
  }

  // ----- ACERVO -------------------------------------------------------------
  let exemplares = 0;
  let emprestados = 0;
  let somaNotas = 0;
  let livrosAvaliados = 0;
  const generoMap = new Map<string, { titulos: number; exemplares: number }>();
  const maisEmprestados: AcervoReport["maisEmprestados"] = [];
  const nuncaEmprestados: string[] = [];

  for (const book of books) {
    const bookLoans = loansByBook.get(book.id) ?? [];
    // Exemplar ocupado = empréstimo/reserva sem devolução (mesma regra do serializeBook).
    const ocupados = bookLoans.filter((l) => l.returnDate === null).length;

    exemplares += book.totalCopies;
    emprestados += Math.min(ocupados, book.totalCopies);

    if (book.rating > 0) {
      somaNotas += book.rating;
      livrosAvaliados += 1;
    }

    const genero = book.genre?.trim() || "Sem gênero";
    const g = generoMap.get(genero) ?? { titulos: 0, exemplares: 0 };
    g.titulos += 1;
    g.exemplares += book.totalCopies;
    generoMap.set(genero, g);

    if (bookLoans.length === 0) {
      nuncaEmprestados.push(book.title);
    } else {
      maisEmprestados.push({
        id: book.id,
        title: book.title,
        author: book.author,
        total: bookLoans.length,
      });
    }
  }

  maisEmprestados.sort((a, b) => b.total - a.total);

  const acervo: AcervoReport = {
    titulos: books.length,
    exemplares,
    disponiveis: Math.max(0, exemplares - emprestados),
    emprestados,
    avaliacaoMedia: livrosAvaliados > 0 ? Number((somaNotas / livrosAvaliados).toFixed(2)) : 0,
    porGenero: [...generoMap.entries()]
      .map(([genero, v]) => ({ genero, ...v }))
      .sort((a, b) => b.exemplares - a.exemplares),
    maisEmprestados: maisEmprestados.slice(0, 10),
    nuncaEmprestados: { total: nuncaEmprestados.length, titulos: nuncaEmprestados.slice(0, 50) },
  };

  // ----- USUÁRIOS -----------------------------------------------------------
  const porPapel = { admin: 0, librarian: 0, reader: 0 };
  let novosUltimos30Dias = 0;
  const leitoresComAtivo = new Set<string>();
  const leitoresEmAtraso = new Set<string>();
  let multaEmAberto = 0;
  const maisAtivos: UsuariosReport["maisAtivos"] = [];

  for (const user of users) {
    porPapel[user.role as keyof typeof porPapel] += 1;
    if (user.createdAt >= cutoff) novosUltimos30Dias += 1;

    const userLoans = loansByUser.get(user.id) ?? [];
    let emAtraso = 0;
    for (const loan of userLoans) {
      const status = loanStatus(loan);
      if (status === "active" || status === "overdue" || status === "pending") {
        leitoresComAtivo.add(user.id);
      }
      if (status === "overdue") {
        emAtraso += 1;
        leitoresEmAtraso.add(user.id);
        multaEmAberto += computeOverdueDays(loan.dueDate, now);
      }
    }

    if (userLoans.length > 0) {
      maisAtivos.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        total: userLoans.length,
        emAtraso,
      });
    }
  }

  maisAtivos.sort((a, b) => b.total - a.total);

  const usuarios: UsuariosReport = {
    total: users.length,
    porPapel,
    leitoresComEmprestimoAtivo: leitoresComAtivo.size,
    leitoresEmAtraso: leitoresEmAtraso.size,
    multaEmAberto,
    novosUltimos30Dias,
    maisAtivos: maisAtivos.slice(0, 10),
  };

  // ----- EMPRÉSTIMOS --------------------------------------------------------
  const porStatus = { pending: 0, active: 0, overdue: 0, returned: 0 };
  let multasAcumuladas = 0;
  let renovacoes = 0;
  let devolvidosNoPrazo = 0;
  let devolvidosComAtraso = 0;
  let ultimos30Dias = 0;

  for (const loan of loans) {
    const status = loanStatus(loan);
    porStatus[status] += 1;
    renovacoes += loan.renewals;
    if (loan.loanDate >= cutoff) ultimos30Dias += 1;
    if (status === "overdue") multasAcumuladas += computeOverdueDays(loan.dueDate, now);
    if (status === "returned" && loan.returnDate) {
      if (loan.returnDate.getTime() > loan.dueDate.getTime()) devolvidosComAtraso += 1;
      else devolvidosNoPrazo += 1;
    }
  }

  const totalDevolvidos = devolvidosNoPrazo + devolvidosComAtraso;
  const emprestimos: EmprestimosReport = {
    total: loans.length,
    porStatus,
    multasAcumuladas,
    renovacoes,
    devolvidosNoPrazo,
    devolvidosComAtraso,
    taxaPontualidade:
      totalDevolvidos > 0 ? Math.round((devolvidosNoPrazo / totalDevolvidos) * 100) : 0,
    ultimos30Dias,
  };

  return { generatedAt: now.toISOString(), acervo, usuarios, emprestimos };
}

// Converte o relatório em CSV (uma seção por bloco) para download.
export function reportToCsv(report: LibraryReport): string {
  const lines: string[] = [];
  const row = (...cells: (string | number)[]) =>
    lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));

  row("Relatório da Biblioteca");
  row("Gerado em", new Date(report.generatedAt).toLocaleString("pt-BR"));
  row("");

  row("ACERVO");
  row("Títulos", report.acervo.titulos);
  row("Exemplares", report.acervo.exemplares);
  row("Disponíveis", report.acervo.disponiveis);
  row("Emprestados", report.acervo.emprestados);
  row("Avaliação média", report.acervo.avaliacaoMedia);
  row("Títulos nunca emprestados", report.acervo.nuncaEmprestados.total);
  row("");
  row("Livros mais emprestados");
  row("Título", "Autor", "Empréstimos");
  for (const b of report.acervo.maisEmprestados) row(b.title, b.author, b.total);
  row("");
  row("Acervo por gênero");
  row("Gênero", "Títulos", "Exemplares");
  for (const g of report.acervo.porGenero) row(g.genero, g.titulos, g.exemplares);
  row("");

  row("USUÁRIOS");
  row("Total", report.usuarios.total);
  row("Administradores", report.usuarios.porPapel.admin);
  row("Bibliotecários", report.usuarios.porPapel.librarian);
  row("Leitores", report.usuarios.porPapel.reader);
  row("Leitores com empréstimo ativo", report.usuarios.leitoresComEmprestimoAtivo);
  row("Leitores em atraso", report.usuarios.leitoresEmAtraso);
  row("Multa em aberto (R$)", report.usuarios.multaEmAberto);
  row("Novos (30 dias)", report.usuarios.novosUltimos30Dias);
  row("");
  row("Usuários mais ativos");
  row("Nome", "Email", "Papel", "Empréstimos", "Em atraso");
  for (const u of report.usuarios.maisAtivos)
    row(u.name, u.email, u.role, u.total, u.emAtraso);
  row("");

  row("EMPRÉSTIMOS");
  row("Total", report.emprestimos.total);
  row("Pendentes (reserva)", report.emprestimos.porStatus.pending);
  row("Ativos", report.emprestimos.porStatus.active);
  row("Atrasados", report.emprestimos.porStatus.overdue);
  row("Devolvidos", report.emprestimos.porStatus.returned);
  row("Multas acumuladas (R$)", report.emprestimos.multasAcumuladas);
  row("Renovações", report.emprestimos.renovacoes);
  row("Devolvidos no prazo", report.emprestimos.devolvidosNoPrazo);
  row("Devolvidos com atraso", report.emprestimos.devolvidosComAtraso);
  row("Taxa de pontualidade (%)", report.emprestimos.taxaPontualidade);
  row("Empréstimos (30 dias)", report.emprestimos.ultimos30Dias);

  return lines.join("\r\n");
}
