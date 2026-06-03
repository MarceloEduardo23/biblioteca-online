"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  BookCopy,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { currentUser, books, users, getAllLoansWithDetails, loading } = useLibrary();

  const loans = getAllLoansWithDetails();

  const isStaff =
    currentUser?.role === "admin" || currentUser?.role === "librarian";

  const stats = useMemo(() => {
    const activeLoans = loans.filter((l) => l.status === "active").length;
    const overdueLoans = loans.filter((l) => l.status === "overdue").length;
    const totalBooks = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const availableBooks = books.reduce((acc, b) => acc + b.availableCopies, 0);

    return {
      totalBooks,
      availableBooks,
      borrowedBooks: totalBooks - availableBooks,
      totalUsers: users.length,
      activeLoans,
      overdueLoans,
    };
  }, [books, users, loans]);

  const recentLoans = useMemo(() => {
    return [...loans]
      .sort((a, b) => b.loanDate.getTime() - a.loanDate.getTime())
      .slice(0, 5);
  }, [loans]);

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
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso Restrito
          </h1>
          <p className="text-muted-foreground">
            Faça login para acessar o painel administrativo
          </p>
        </main>
      </div>
    );
  }

  if (!isStaff) {
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
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground mt-1">
                Bem-vindo, {currentUser.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/admin/escanear">Escanear</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/livros">Gerenciar Livros</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/categorias">Categorias</Link>
              </Button>
              {currentUser.role === "admin" && (
                <Button variant="outline" asChild>
                  <Link href="/admin/usuarios">Gerenciar Usuários</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BookOpen className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalBooks}
                  </p>
                  <p className="text-xs text-muted-foreground">Total de Livros</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.availableBooks}
                  </p>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BookCopy className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.borrowedBooks}
                  </p>
                  <p className="text-xs text-muted-foreground">Emprestados</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Users className="h-8 w-8 text-indigo-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalUsers}
                  </p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BookCopy className="h-8 w-8 text-cyan-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.activeLoans}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Empréstimos Ativos
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.overdueLoans}
                  </p>
                  <p className="text-xs text-muted-foreground">Atrasados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Loans */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Empréstimos Recentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/emprestimos">
                  Ver Todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentLoans.length > 0 ? (
                <div className="space-y-4">
                  {recentLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {loan.book.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Emprestado para {loan.user.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            loan.status === "active"
                              ? "bg-blue-500/20 text-blue-500"
                              : loan.status === "overdue"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-emerald-500/20 text-emerald-500"
                          }`}
                        >
                          {loan.status === "active"
                            ? "Ativo"
                            : loan.status === "overdue"
                            ? "Atrasado"
                            : "Devolvido"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {loan.loanDate.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum empréstimo registrado
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
