import { prisma } from "./prisma";

export const RESERVATION_MINUTES = 30;

// Remove reservas pendentes que passaram dos 30 minutos sem retirada.
// Assim a cópia volta a ficar disponível e o leitor pode reservar de novo.
export async function cleanupExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_MINUTES * 60 * 1000);
  await prisma.loan.deleteMany({
    where: {
      pickedUpAt: null,
      returnDate: null,
      loanDate: { lt: cutoff },
    },
  });
}
