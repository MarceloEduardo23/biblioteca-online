import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { serializeLoan, publicUserSelect } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

const RENEW_DAYS = 7;
const MAX_RENEWALS = 2;

// POST /api/loans/[id]/renew — renova o empréstimo (estende o prazo).
// Pode ser feito pelo próprio leitor ou pela equipe.
export async function POST(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Empréstimo não encontrado." }, { status: 404 });
  }

  const owns = existing.userId === user.id;
  if (!owns && !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  if (existing.returnDate) {
    return NextResponse.json({ error: "Empréstimo já encerrado." }, { status: 409 });
  }
  if (!existing.pickedUpAt) {
    return NextResponse.json(
      { error: "Confirme a retirada antes de renovar." },
      { status: 409 }
    );
  }
  if (existing.renewals >= MAX_RENEWALS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_RENEWALS} renovações atingido.` },
      { status: 409 }
    );
  }

  const base = new Date(
    Math.max(existing.dueDate.getTime(), Date.now())
  );
  const newDue = new Date(base.getTime() + RENEW_DAYS * 24 * 60 * 60 * 1000);

  const loan = await prisma.loan.update({
    where: { id },
    data: { dueDate: newDue, renewals: { increment: 1 } },
    include: { book: true, user: { select: publicUserSelect } },
  });
  return NextResponse.json({ loan: serializeLoan(loan) });
}
