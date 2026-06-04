import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { serializeLoan, publicUserSelect } from "@/lib/serializers";
import { cleanupExpiredReservations } from "@/lib/reservations";

type Params = { params: Promise<{ id: string }> };

const LOAN_DAYS = 14;

// POST /api/loans/[id]/pickup — confirma a RETIRADA do livro (escaneado na entrega).
// Só a equipe (admin/bibliotecário) registra a retirada.
export async function POST(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await cleanupExpiredReservations();

  const { id } = await params;
  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Reserva não encontrada ou expirada." },
      { status: 404 }
    );
  }
  if (existing.returnDate) {
    return NextResponse.json({ error: "Empréstimo já encerrado." }, { status: 409 });
  }
  if (existing.pickedUpAt) {
    return NextResponse.json({ error: "Retirada já confirmada." }, { status: 409 });
  }

  // Na retirada, o prazo de 14 dias começa a contar a partir de agora.
  const dueDate = new Date(Date.now() + LOAN_DAYS * 24 * 60 * 60 * 1000);
  const loan = await prisma.loan.update({
    where: { id },
    data: { pickedUpAt: new Date(), dueDate },
    include: { book: true, user: { select: publicUserSelect } },
  });
  return NextResponse.json({ loan: serializeLoan(loan) });
}
