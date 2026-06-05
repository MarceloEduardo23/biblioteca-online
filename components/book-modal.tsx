"use client";

import Image from "next/image";
import { Clock, BookOpen } from "lucide-react";
import type { Book, LoanWithDetails } from "@/lib/types";
import { useLibrary } from "@/contexts/library-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReservationCountdown } from "@/components/reservation-countdown";
import { useState } from "react";

interface BookModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
}

export function BookModal({ book, open, onClose }: BookModalProps) {
  const { currentUser, createLoan, loans, suspendedUntil } = useLibrary();
  const [loanCreated, setLoanCreated] = useState<LoanWithDetails | null>(null);
  const [loading, setLoading] = useState(false);

  if (!book) return null;

  const handleLoan = async () => {
    setLoading(true);
    const loan = await createLoan(book.id);
    setLoading(false);
    if (loan) {
      setLoanCreated(loan);
    }
  };

  const handleClose = () => {
    setLoanCreated(null);
    onClose();
  };

  const myActiveLoans = loans.filter(
    (l) => l.userId === currentUser?.id && l.status !== "returned"
  );
  const alreadyHas = myActiveLoans.some((l) => l.bookId === book.id);
  const reachedLimit = myActiveLoans.length >= 3;
  const isSuspended = !!suspendedUntil;
  const canBorrow =
    !!currentUser && book.availableCopies > 0 && !alreadyHas && !reachedLimit && !isSuspended;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="sr-only">{book.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do livro {book.title} de {book.author}
          </DialogDescription>
        </DialogHeader>

        {loanCreated ? (
          <LoanConfirmation loan={loanCreated} onClose={handleClose} />
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-36 mx-auto md:mx-0 md:w-48 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={book.cover}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 144px, 192px"
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{book.title}</h2>
                <p className="text-muted-foreground">{book.author}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">{book.publishedYear}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{book.genre}</span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {book.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ISBN: {book.isbn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">14 dias de empréstimo</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    book.availableCopies > 0
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {book.availableCopies} de {book.totalCopies} disponíveis
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                {!currentUser ? (
                  <p className="text-sm text-muted-foreground">
                    Faça login para realizar empréstimos
                  </p>
                ) : (
                  <Button
                    onClick={handleLoan}
                    disabled={!canBorrow || loading}
                    className="flex-1"
                  >
                    {loading
                      ? "Processando..."
                      : alreadyHas
                      ? "Você já está com este livro"
                      : isSuspended
                      ? `Suspenso até ${suspendedUntil!.toLocaleDateString("pt-BR")}`
                      : reachedLimit
                      ? "Limite de 3 livros atingido"
                      : book.availableCopies > 0
                      ? "Realizar Empréstimo"
                      : "Indisponível"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoanConfirmation({
  loan,
  onClose,
}: {
  loan: LoanWithDetails;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-6">
      <div className="bg-emerald-500/20 p-4 rounded-full">
        <BookOpen className="h-12 w-12 text-emerald-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Livro reservado!</h2>
        <p className="text-muted-foreground mt-1">
          Você tem 30 minutos para retirar na biblioteca. O atendente vai
          escanear o livro para confirmar a retirada.
        </p>
      </div>

      <div className="bg-secondary/50 rounded-xl px-8 py-5">
        <p className="text-xs text-muted-foreground mb-1">Tempo para retirada</p>
        <ReservationCountdown
          expiresAt={loan.reservationExpiresAt}
          className="text-4xl font-bold tabular-nums text-foreground"
        />
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-foreground">
          <strong>Livro:</strong> {loan.book.title}
        </p>
        <p className="text-foreground">
          <strong>Leitor:</strong> {loan.user.name}
        </p>
      </div>

      <Button onClick={onClose} className="mt-4">
        Fechar
      </Button>
    </div>
  );
}
