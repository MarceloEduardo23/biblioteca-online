import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { serializeLoan, publicUserSelect } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

// POST /api/loans/[id]/return — dá baixa na devolução e repõe 1 cópia no acervo.
// Pode ser feito pela equipe (admin/bibliotecário) ou pelo próprio leitor do empréstimo.
export async function POST(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const loan = await prisma.$transaction(async (tx) => {
      const existing = await tx.loan.findUnique({ where: { id } });
      if (!existing) throw new Error("NOT_FOUND");

      const owns = existing.userId === user.id;
      if (!owns && !isStaff(user.role)) throw new Error("FORBIDDEN");
      if (existing.returnDate) throw new Error("ALREADY_RETURNED");

      // Basta encerrar o empréstimo: a disponibilidade é recalculada
      // automaticamente (total de cópias - empréstimos ativos).
      return tx.loan.update({
        where: { id },
        data: { returnDate: new Date() },
        include: { book: true, user: { select: publicUserSelect } },
      });
    });

    return NextResponse.json({ loan: serializeLoan(loan) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") return NextResponse.json({ error: "Empréstimo não encontrado." }, { status: 404 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    if (message === "ALREADY_RETURNED") return NextResponse.json({ error: "Empréstimo já devolvido." }, { status: 409 });
    return NextResponse.json({ error: "Erro ao registrar devolução." }, { status: 500 });
  }
}
