"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BookOpen, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function MeusEmprestimosPage() {
  const { currentUser, getUserLoans, renewLoan, loading } = useLibrary();

  const loans = useMemo(() => {
    if (!currentUser) return [];
    return getUserLoans(currentUser.id);
  }, [currentUser, getUserLoans]);

  const pendingLoans = loans.filter((l) => l.status === "pending");
  const activeLoans = loans.filter((l) => l.status === "active");
  const overdueLoans = loans.filter((l) => l.status === "overdue");
  const returnedLoans = loans.filter((l) => l.status === "returned");

  const handleRenew = async (loanId: string) => {
    const res = await renewLoan(loanId);
    toast[res.ok ? "success" : "error"](
      res.ok ? "Empréstimo renovado!" : res.error || "Não foi possível renovar."
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 md:px-12 py-20 text-center text-muted-foreground">
          Carregando...
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 md:px-12 py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Faça login para ver seus empréstimos
          </h1>
          <p className="text-muted-foreground">
            Você precisa estar logado para acessar esta página
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 md:px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Empréstimos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus livros emprestados
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-3 rounded-full">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{activeLoans.length}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-3 rounded-full">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overdueLoans.length}</p>
                    <p className="text-xs text-muted-foreground">Atrasados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-3 rounded-full">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{returnedLoans.length}</p>
                    <p className="text-xs text-muted-foreground">Devolvidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aguardando retirada */}
          {pendingLoans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aguardando retirada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-amber-500/10"
                  >
                    <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={loan.book.cover}
                        alt={loan.book.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-1">
                        {loan.book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {loan.book.author}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
                        <Clock className="h-3 w-3" />
                        Vá à biblioteca — o livro será escaneado na retirada
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active & Overdue Loans */}
          {(activeLoans.length > 0 || overdueLoans.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Empréstimos Ativos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...overdueLoans, ...activeLoans].map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={loan.book.cover}
                        alt={loan.book.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-1">
                        {loan.book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {loan.book.author}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Devolução: {loan.dueDate.toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {loan.status === "overdue" && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-500">
                          Atrasado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ver QR Code
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>QR Code do Empréstimo</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center py-6 space-y-4">
                            <div className="bg-white p-4 rounded-xl">
                              <QRCodeSVG
                                value={JSON.stringify({
                                  loanId: loan.id,
                                  bookTitle: loan.book.title,
                                  userName: loan.user.name,
                                  dueDate: loan.dueDate.toISOString(),
                                })}
                                size={200}
                                level="H"
                              />
                            </div>
                            <div className="text-center text-sm">
                              <p className="text-foreground font-medium">
                                {loan.book.title}
                              </p>
                              <p className="text-muted-foreground">
                                Apresente na devolução
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={loan.renewals >= 2}
                        onClick={() => handleRenew(loan.id)}
                      >
                        {loan.renewals >= 2 ? "Sem renovações" : "Renovar"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Devolução na biblioteca
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Returned Loans */}
          {returnedLoans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {returnedLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 opacity-75"
                  >
                    <div className="relative w-12 h-18 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={loan.book.cover}
                        alt={loan.book.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-1">
                        {loan.book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {loan.book.author}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500">
                        Devolvido
                      </span>
                      {loan.returnDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {loan.returnDate.toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {loans.length === 0 && (
            <Card>
              <CardContent className="py-20 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Nenhum empréstimo encontrado
                </h3>
                <p className="text-muted-foreground text-sm">
                  Visite o catálogo para encontrar seu próximo livro
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
