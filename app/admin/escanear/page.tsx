"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import {
  Camera,
  ScanLine,
  AlertCircle,
  BookPlus,
  Search,
  QrCode,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { BookQR, QR_PREFIX } from "@/components/book-qr";
import { ImageUpload } from "@/components/image-upload";
import type { Book } from "@/lib/types";

const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop";

export default function AdminEscanearPage() {
  const {
    currentUser,
    books,
    users,
    loans,
    loading,
    createLoanFor,
    returnBook,
    addBook,
  } = useLibrary();

  const isStaff =
    currentUser?.role === "admin" || currentUser?.role === "librarian";

  const [scanning, setScanning] = useState(false);
  const [foundId, setFoundId] = useState<string | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  // Deriva o livro a partir do estado atual (mantém disponibilidade em dia).
  const found = useMemo(
    () => books.find((b) => b.id === foundId) ?? null,
    [books, foundId]
  );

  const resolve = useCallback(
    (text: string) => {
      const t = text.trim();
      let book: Book | undefined;
      if (t.startsWith(QR_PREFIX)) {
        const id = t.slice(QR_PREFIX.length);
        book = books.find((b) => b.id === id);
      } else {
        const norm = t.replace(/[^0-9Xx]/g, "");
        book =
          norm.length > 0
            ? books.find(
                (b) => b.isbn && b.isbn.replace(/[^0-9Xx]/g, "") === norm
              )
            : undefined;
      }

      setScanning(false);
      if (book) {
        setFoundId(book.id);
        setNotFoundCode(null);
        toast.success(`Livro identificado: ${book.title}`);
      } else {
        setFoundId(null);
        // Se for um QR nosso desconhecido, não dá pra cadastrar por ISBN.
        setNotFoundCode(t.startsWith(QR_PREFIX) ? "" : t.replace(/[^0-9Xx]/g, "") || t);
        toast.error("Livro não encontrado no acervo.");
      }
    },
    [books]
  );

  const reset = useCallback(() => {
    setFoundId(null);
    setNotFoundCode(null);
    setManual("");
  }, []);

  // ---- Gating de acesso (igual às demais telas do admin) ----
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 md:px-12 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ScanLine className="h-7 w-7" />
              Escanear
            </h1>
            <p className="text-muted-foreground mt-1">
              Leia o código de barras (ISBN) ou o QR do livro para emprestar,
              devolver ou cadastrar. Funciona melhor pelo celular.
            </p>
          </div>

          {/* Câmera */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {scanning ? (
                <>
                  <BarcodeScanner onResult={resolve} />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setScanning(false)}
                  >
                    Parar câmera
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={() => setScanning(true)}>
                  <Camera className="mr-2 h-4 w-4" />
                  Abrir câmera e escanear
                </Button>
              )}

              {/* Alternativa manual (útil no computador, sem câmera) */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="manual" className="text-xs text-muted-foreground">
                    ou digite o ISBN manualmente
                  </Label>
                  <Input
                    id="manual"
                    inputMode="numeric"
                    placeholder="978..."
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && manual.trim()) resolve(manual);
                    }}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => manual.trim() && resolve(manual)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Livro encontrado */}
          {found && (
            <FoundBookPanel
              book={found}
              users={users}
              activeLoans={loans.filter(
                (l) => l.bookId === found.id && l.status !== "returned"
              )}
              onLend={async (email) => {
                const res = await createLoanFor(found.id, { email });
                if (res.ok) toast.success("Empréstimo registrado!");
                else toast.error(res.error || "Não foi possível emprestar.");
                return res.ok;
              }}
              onReturn={async (loanId) => {
                const ok = await returnBook(loanId);
                if (ok) toast.success("Devolução registrada!");
                else toast.error("Não foi possível registrar a devolução.");
              }}
              onScanAnother={() => {
                reset();
                setScanning(true);
              }}
            />
          )}

          {/* Não encontrado */}
          {notFoundCode !== null && !found && (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                <p className="text-foreground font-medium">
                  Livro não encontrado no acervo.
                </p>
                {notFoundCode ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Código lido: <span className="font-mono">{notFoundCode}</span>
                    </p>
                    <Button onClick={() => setRegisterOpen(true)}>
                      <BookPlus className="mr-2 h-4 w-4" />
                      Cadastrar este livro
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Esse QR não corresponde a nenhum livro cadastrado.
                  </p>
                )}
                <Button variant="ghost" onClick={reset}>
                  Limpar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Etiquetas QR de todo o acervo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Etiquetas QR do acervo
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLabels((s) => !s)}
                >
                  {showLabels ? "Ocultar" : "Mostrar"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showLabels && (
              <CardContent>
                {books.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum livro cadastrado ainda.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {books.map((b) => (
                      <div key={b.id} className="flex flex-col items-center gap-2">
                        <BookQR book={b} size={120} />
                        <p className="text-xs text-center text-muted-foreground line-clamp-2">
                          {b.title}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </main>

      {/* Dialog de cadastro rápido por ISBN */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar livro</DialogTitle>
          </DialogHeader>
          <QuickRegisterForm
            isbn={notFoundCode || ""}
            onCancel={() => setRegisterOpen(false)}
            onSubmit={async (data) => {
              const created = await addBook(data);
              setRegisterOpen(false);
              if (created) {
                setFoundId(created.id);
                setNotFoundCode(null);
                toast.success("Livro cadastrado!");
              } else {
                toast.error("Não foi possível cadastrar o livro.");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel do livro identificado: empréstimo e devolução
// ---------------------------------------------------------------------------
function FoundBookPanel({
  book,
  users,
  activeLoans,
  onLend,
  onReturn,
  onScanAnother,
}: {
  book: Book;
  users: { id: string; name: string; email: string }[];
  activeLoans: {
    id: string;
    user: { name: string };
    dueDate: Date;
    status: string;
  }[];
  onLend: (email: string) => Promise<boolean>;
  onReturn: (loanId: string) => Promise<void>;
  onScanAnother: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-secondary">
            <Image
              src={book.cover || PLACEHOLDER_COVER}
              alt={book.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground">{book.title}</h2>
            <p className="text-sm text-muted-foreground">{book.author}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ISBN: {book.isbn || "—"}
            </p>
            <Badge
              variant={book.availableCopies > 0 ? "default" : "secondary"}
              className="mt-2"
            >
              {book.availableCopies}/{book.totalCopies} disponíveis
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="emprestimo">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emprestimo">Empréstimo</TabsTrigger>
            <TabsTrigger value="devolucao">Devolução</TabsTrigger>
          </TabsList>

          {/* Empréstimo */}
          <TabsContent value="emprestimo" className="space-y-3 pt-3">
            <div className="space-y-1">
              <Label htmlFor="reader">Email do leitor</Label>
              <Input
                id="reader"
                type="email"
                list="readers-list"
                placeholder="leitor@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <datalist id="readers-list">
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.name}
                  </option>
                ))}
              </datalist>
            </div>
            <Button
              className="w-full"
              disabled={busy || !email.trim() || book.availableCopies <= 0}
              onClick={async () => {
                setBusy(true);
                const ok = await onLend(email.trim());
                setBusy(false);
                if (ok) setEmail("");
              }}
            >
              {book.availableCopies <= 0
                ? "Sem exemplares disponíveis"
                : "Registrar empréstimo"}
            </Button>
          </TabsContent>

          {/* Devolução */}
          <TabsContent value="devolucao" className="space-y-3 pt-3">
            {activeLoans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum empréstimo ativo para este livro.
              </p>
            ) : (
              activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {loan.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence em {loan.dueDate.toLocaleDateString("pt-BR")}
                      {loan.status === "overdue" && (
                        <span className="text-red-500"> · atrasado</span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await onReturn(loan.id);
                      setBusy(false);
                    }}
                  >
                    Devolver
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={onScanAnother}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Escanear outro
          </Button>
          <BookQRInline book={book} />
        </div>
      </CardContent>
    </Card>
  );
}

// QR compacto dentro do painel (abre num dialog para imprimir).
function BookQRInline({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <QrCode className="mr-2 h-4 w-4" />
        QR do livro
      </Button>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">{book.title}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <BookQR book={book} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Cadastro rápido com auto-preenchimento via Open Library (por ISBN)
// ---------------------------------------------------------------------------
function QuickRegisterForm({
  isbn,
  onSubmit,
  onCancel,
}: {
  isbn: string;
  onSubmit: (data: Omit<Book, "id">) => void;
  onCancel: () => void;
}) {
  const { categories } = useLibrary();
  const [form, setForm] = useState({
    title: "",
    author: "",
    cover: PLACEHOLDER_COVER,
    genre: "Clássicos",
    isbn,
    description: "",
    publishedYear: new Date().getFullYear(),
    totalCopies: 1,
    availableCopies: 1,
    rating: 0,
  });
  const [looking, setLooking] = useState(false);

  async function lookup() {
    if (!form.isbn.trim()) return;
    setLooking(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(
          form.isbn.trim()
        )}&format=json&jscmd=data`
      );
      const data = await res.json();
      const entry = data[`ISBN:${form.isbn.trim()}`];
      if (!entry) {
        toast.message("Nada encontrado para esse ISBN — preencha manualmente.");
        return;
      }
      const year = String(entry.publish_date || "").match(/\d{4}/)?.[0];
      setForm((f) => ({
        ...f,
        title: entry.title || f.title,
        author: entry.authors?.[0]?.name || f.author,
        cover: entry.cover?.medium || entry.cover?.large || f.cover,
        publishedYear: year ? Number(year) : f.publishedYear,
      }));
      toast.success("Dados preenchidos pelo ISBN.");
    } catch {
      toast.error("Não foi possível consultar o ISBN agora.");
    } finally {
      setLooking(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="r-isbn">ISBN</Label>
          <Input
            id="r-isbn"
            value={form.isbn}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            required
          />
        </div>
        <Button type="button" variant="secondary" disabled={looking} onClick={lookup}>
          {looking ? "Buscando…" : "Buscar dados"}
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="r-title">Título</Label>
        <Input
          id="r-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="r-author">Autor</Label>
          <Input
            id="r-author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-genre">Categoria</Label>
          <Input
            id="r-genre"
            list="cats-list"
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          />
          <datalist id="cats-list">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-year">Ano</Label>
          <Input
            id="r-year"
            type="number"
            value={form.publishedYear}
            onChange={(e) =>
              setForm({ ...form, publishedYear: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-total">Total de cópias</Label>
          <Input
            id="r-total"
            type="number"
            min="1"
            value={form.totalCopies}
            onChange={(e) => {
              const total = Number(e.target.value);
              setForm({ ...form, totalCopies: total, availableCopies: total });
            }}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Capa</Label>
        <ImageUpload value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Cadastrar</Button>
      </div>
    </form>
  );
}
