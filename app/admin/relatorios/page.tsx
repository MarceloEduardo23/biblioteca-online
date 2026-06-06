"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  Download,
  RefreshCw,
  BookOpen,
  BookCopy,
  TrendingUp,
  Star,
  Users,
  UserCheck,
  AlertTriangle,
  DollarSign,
  CalendarPlus,
  Repeat,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { LibraryReport } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  active: "#3b82f6",
  overdue: "#ef4444",
  returned: "#10b981",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendentes",
  active: "Ativos",
  overdue: "Atrasados",
  returned: "Devolvidos",
};
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  librarian: "Bibliotecário",
  reader: "Leitor",
};
const GENRE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#ef4444", "#84cc16", "#a855f7",
];

function StatCard({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  value: string | number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Icon className={`h-8 w-8 mb-2 ${color}`} />
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminRelatoriosPage() {
  const { currentUser, loading } = useLibrary();
  const [report, setReport] = useState<LibraryReport | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff =
    currentUser?.role === "admin" || currentUser?.role === "librarian";

  const loadReport = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao carregar relatório.");
      setReport(data.report as LibraryReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar relatório.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isStaff) loadReport();
  }, [isStaff, loadReport]);

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
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página
          </p>
        </main>
      </div>
    );
  }

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 md:px-12 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
              <p className="text-muted-foreground mt-1">
                Situação do acervo, dos usuários e dos empréstimos
                {report && (
                  <>
                    {" · "}
                    gerado em{" "}
                    {new Date(report.generatedAt).toLocaleString("pt-BR")}
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={loadReport} disabled={fetching}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${fetching ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
              <Button asChild disabled={!report}>
                <a href="/api/reports?format=csv" download>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar CSV
                </a>
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-red-500/40">
              <CardContent className="pt-6 flex items-center gap-3 text-red-500">
                <AlertCircle className="h-5 w-5" />
                {error}
              </CardContent>
            </Card>
          )}

          {fetching && !report ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : report ? (
            <Tabs defaultValue="acervo" className="space-y-6">
              <TabsList>
                <TabsTrigger value="acervo">Acervo</TabsTrigger>
                <TabsTrigger value="usuarios">Usuários</TabsTrigger>
                <TabsTrigger value="emprestimos">Empréstimos</TabsTrigger>
              </TabsList>

              {/* ----------------------- ACERVO ----------------------- */}
              <TabsContent value="acervo" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatCard icon={BookOpen} color="text-blue-500" value={report.acervo.titulos} label="Títulos" />
                  <StatCard icon={BookCopy} color="text-indigo-500" value={report.acervo.exemplares} label="Exemplares" />
                  <StatCard icon={TrendingUp} color="text-emerald-500" value={report.acervo.disponiveis} label="Disponíveis" />
                  <StatCard icon={BookCopy} color="text-amber-500" value={report.acervo.emprestados} label="Emprestados" />
                  <StatCard icon={Star} color="text-yellow-500" value={report.acervo.avaliacaoMedia} label="Nota média" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Livros mais emprestados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {report.acervo.maisEmprestados.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={report.acervo.maisEmprestados.map((b) => ({
                              name: b.title.length > 18 ? b.title.slice(0, 18) + "…" : b.title,
                              total: b.total,
                            }))}
                            layout="vertical"
                            margin={{ left: 8, right: 16 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                            <XAxis type="number" allowDecimals={false} fontSize={12} />
                            <YAxis type="category" dataKey="name" width={140} fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} name="Empréstimos" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum empréstimo registrado
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Acervo por gênero</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {report.acervo.porGenero.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={report.acervo.porGenero.map((g) => ({
                                name: g.genero,
                                value: g.exemplares,
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(e) => e.name}
                            >
                              {report.acervo.porGenero.map((_, i) => (
                                <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum livro cadastrado
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Títulos nunca emprestados ({report.acervo.nuncaEmprestados.total})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.acervo.nuncaEmprestados.total > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {report.acervo.nuncaEmprestados.titulos.map((t, i) => (
                          <Badge key={i} variant="secondary">{t}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Todos os títulos já foram emprestados ao menos uma vez.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------------------- USUÁRIOS ----------------------- */}
              <TabsContent value="usuarios" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard icon={Users} color="text-indigo-500" value={report.usuarios.total} label="Total" />
                  <StatCard icon={Users} color="text-purple-500" value={report.usuarios.porPapel.reader} label="Leitores" />
                  <StatCard icon={UserCheck} color="text-blue-500" value={report.usuarios.porPapel.librarian} label="Bibliotecários" />
                  <StatCard icon={UserCheck} color="text-cyan-500" value={report.usuarios.porPapel.admin} label="Administradores" />
                  <StatCard icon={AlertTriangle} color="text-red-500" value={report.usuarios.leitoresEmAtraso} label="Em atraso" />
                  <StatCard icon={DollarSign} color="text-amber-500" value={formatBRL(report.usuarios.multaEmAberto)} label="Multa em aberto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard icon={UserCheck} color="text-emerald-500" value={report.usuarios.leitoresComEmprestimoAtivo} label="Leitores com empréstimo ativo" />
                  <StatCard icon={CalendarPlus} color="text-sky-500" value={report.usuarios.novosUltimos30Dias} label="Novos (últimos 30 dias)" />
                  <StatCard icon={Users} color="text-violet-500" value={report.usuarios.maisAtivos.length} label="Usuários que já pegaram livros" />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Usuários mais ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.usuarios.maisAtivos.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead className="text-right">Empréstimos</TableHead>
                            <TableHead className="text-right">Em atraso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.usuarios.maisAtivos.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="font-medium text-foreground">{u.name}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{u.total}</TableCell>
                              <TableCell className="text-right">
                                {u.emAtraso > 0 ? (
                                  <span className="text-red-500 font-medium">{u.emAtraso}</span>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum empréstimo registrado por usuários ainda
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------------------- EMPRÉSTIMOS ----------------------- */}
              <TabsContent value="emprestimos" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard icon={BookCopy} color="text-indigo-500" value={report.emprestimos.total} label="Total" />
                  <StatCard icon={Clock} color="text-amber-500" value={report.emprestimos.porStatus.pending} label="Pendentes" />
                  <StatCard icon={BookOpen} color="text-blue-500" value={report.emprestimos.porStatus.active} label="Ativos" />
                  <StatCard icon={AlertTriangle} color="text-red-500" value={report.emprestimos.porStatus.overdue} label="Atrasados" />
                  <StatCard icon={CheckCircle2} color="text-emerald-500" value={report.emprestimos.porStatus.returned} label="Devolvidos" />
                  <StatCard icon={Repeat} color="text-violet-500" value={report.emprestimos.renovacoes} label="Renovações" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard icon={DollarSign} color="text-amber-500" value={formatBRL(report.emprestimos.multasAcumuladas)} label="Multas acumuladas" />
                  <StatCard icon={CheckCircle2} color="text-emerald-500" value={`${report.emprestimos.taxaPontualidade}%`} label="Devoluções no prazo" />
                  <StatCard icon={CalendarPlus} color="text-sky-500" value={report.emprestimos.ultimos30Dias} label="Novos (últimos 30 dias)" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Empréstimos por status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(report.emprestimos.porStatus)
                              .filter(([, v]) => v > 0)
                              .map(([k, v]) => ({ name: STATUS_LABELS[k], key: k, value: v }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(e) => `${e.name}: ${e.value}`}
                          >
                            {Object.entries(report.emprestimos.porStatus)
                              .filter(([, v]) => v > 0)
                              .map(([k]) => (
                                <Cell key={k} fill={STATUS_COLORS[k]} />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pontualidade nas devoluções</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            { name: "No prazo", total: report.emprestimos.devolvidosNoPrazo },
                            { name: "Com atraso", total: report.emprestimos.devolvidosComAtraso },
                          ]}
                          margin={{ left: 8, right: 16 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis allowDecimals={false} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Devoluções">
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </main>
    </div>
  );
}
