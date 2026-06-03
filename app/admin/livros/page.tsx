"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import type { Book } from "@/lib/types";

export default function AdminLivrosPage() {
  const { currentUser, books, addBook, updateBook, deleteBook, loading } = useLibrary();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const isStaff =
    currentUser?.role === "admin" || currentUser?.role === "librarian";

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerenciar Livros
              </h1>
              <p className="text-muted-foreground mt-1">
                {books.length} livros cadastrados
              </p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Livro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Livro</DialogTitle>
                </DialogHeader>
                <BookForm
                  onSubmit={(data) => {
                    addBook(data);
                    setIsAddOpen(false);
                  }}
                  onCancel={() => setIsAddOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="relative w-12 h-18 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={book.cover}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {book.author} | {book.genre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {book.availableCopies}/{book.totalCopies} disponíveis
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={editingBook?.id === book.id}
                        onOpenChange={(open) =>
                          setEditingBook(open ? book : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Editar Livro</DialogTitle>
                          </DialogHeader>
                          <BookForm
                            book={book}
                            onSubmit={(data) => {
                              updateBook(book.id, data);
                              setEditingBook(null);
                            }}
                            onCancel={() => setEditingBook(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteBook(book.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function BookForm({
  book,
  onSubmit,
  onCancel,
}: {
  book?: Book;
  onSubmit: (data: Omit<Book, "id">) => void;
  onCancel: () => void;
}) {
  const { categories } = useLibrary();
  const categoryNames = categories.map((c) => c.name);
  const [formData, setFormData] = useState({
    title: book?.title || "",
    author: book?.author || "",
    cover: book?.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop",
    genre: book?.genre || "Clássicos",
    isbn: book?.isbn || "",
    description: book?.description || "",
    publishedYear: book?.publishedYear || new Date().getFullYear(),
    totalCopies: book?.totalCopies || 1,
    availableCopies: book?.availableCopies || 1,
    rating: book?.rating ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Autor</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) =>
              setFormData({ ...formData, author: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre">Gênero</Label>
          <Select
            value={formData.genre}
            onValueChange={(value) => setFormData({ ...formData, genre: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                new Set([
                  ...(formData.genre ? [formData.genre] : []),
                  ...categoryNames,
                ])
              ).map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Ano de Publicação</Label>
          <Input
            id="year"
            type="number"
            value={formData.publishedYear}
            onChange={(e) =>
              setFormData({ ...formData, publishedYear: parseInt(e.target.value) })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="total">Total de Cópias</Label>
          <Input
            id="total"
            type="number"
            min="1"
            value={formData.totalCopies}
            onChange={(e) => {
              const total = parseInt(e.target.value) || 1;
              setFormData({ ...formData, totalCopies: total, availableCopies: total });
            }}
            required
          />
          <p className="text-xs text-muted-foreground">
            A disponibilidade é calculada automaticamente pelos empréstimos ativos.
          </p>
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Capa</Label>
          <ImageUpload
            value={formData.cover}
            onChange={(v) => setFormData({ ...formData, cover: v })}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{book ? "Salvar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
