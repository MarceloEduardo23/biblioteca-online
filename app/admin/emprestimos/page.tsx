"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, Search, QrCode, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminEmprestimosPage() {
  const { currentUser, getAllLoansWithDetails, returnBook, pickupLoan, loading } = useLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isStaff =
    currentUser?.role === "admin" || currentUser?.role === "librarian";

  const loans = getAllLoansWithDetails();

  const filteredLoans = useMemo(() => {
    let result = loans;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (loan) =>
          loan.book.title.toLowerCase().includes(query) ||
          loan.user.name.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((loan) => loan.status === statusFilter);
    }

    return result.sort((a, b) => b.loanDate.getTime() - a.loanDate.getTime());
  }, [loans, searchQuery, statusFilter]);

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

  if (!currentUser || !isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 md:px-12 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 md:px-12 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerenciar Empréstimos
              </h1>
              <p className="text-muted-foreground mt-1">
                {filteredLoans.length} empréstimo(s)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-0"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="overdue">Atrasados</SelectItem>
                  <SelectItem value="returned">Devolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredLoans.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="flex flex-wrap items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
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
                          {loan.user.name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            Empréstimo: {loan.loanDate.toLocaleDateString("pt-BR")}
                          </span>
                          <span>
                            Devolução: {loan.dueDate.toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full ${
                          loan.status === "pending"
                            ? "bg-amber-500/20 text-amber-500"
                            : loan.status === "active"
                            ? "bg-blue-500/20 text-blue-500"
                            : loan.status === "overdue"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-emerald-500/20 text-emerald-500"
                        }`}
                      >
                        {loan.status === "pending"
                          ? "Aguardando retirada"
                          : loan.status === "active"
                          ? "Ativo"
                          : loan.status === "overdue"
                          ? "Atrasado"
                          : "Devolvido"}
                      </span>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4" />
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
                                  Leitor: {loan.user.name}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {loan.status === "pending" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={async () => {
                              const res = await pickupLoan(loan.id);
                              toast[res.ok ? "success" : "error"](
                                res.ok
                                  ? "Retirada confirmada!"
                                  : res.error || "Falha ao confirmar."
                              );
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirmar retirada
                          </Button>
                        )}
                        {(loan.status === "active" || loan.status === "overdue") && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={async () => {
                              const ok = await returnBook(loan.id);
                              toast[ok ? "success" : "error"](
                                ok ? "Devolução registrada!" : "Falha ao devolver."
                              );
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Devolver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground">
                    Nenhum empréstimo encontrado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
