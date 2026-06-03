"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle, Check, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { genres } from "@/lib/data";

export default function AdminCategoriasPage() {
  const {
    currentUser,
    categories,
    books,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useLibrary();

  const isStaff =
    currentUser?.role === "admin" || currentUser?.role === "librarian";

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  const countByGenre = (name: string) =>
    books.filter((b) => b.genre === name).length;

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    const res = await addCategory(name);
    if (res.ok) {
      setNewName("");
      toast.success("Categoria adicionada.");
    } else {
      toast.error(res.error || "Não foi possível adicionar.");
    }
  }

  async function handleRename(id: string) {
    const name = editName.trim();
    if (!name) return;
    const res = await updateCategory(id, name);
    if (res.ok) {
      setEditingId(null);
      toast.success("Categoria atualizada (livros incluídos).");
    } else {
      toast.error(res.error || "Não foi possível renomear.");
    }
  }

  async function importDefaults() {
    const defaults = genres.filter((g) => g !== "Todos");
    const existing = new Set(categories.map((c) => c.name));
    const toCreate = defaults.filter((g) => !existing.has(g));
    if (toCreate.length === 0) {
      toast.message("As categorias padrão já estão cadastradas.");
      return;
    }
    for (const name of toCreate) await addCategory(name);
    toast.success(`${toCreate.length} categoria(s) importada(s).`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 md:px-12 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Tag className="h-7 w-7" />
              Categorias
            </h1>
            <p className="text-muted-foreground mt-1">
              {categories.length} categoria(s). Renomear atualiza os livros
              automaticamente.
            </p>
          </div>

          {/* Adicionar */}
          <Card>
            <CardContent className="pt-6 flex gap-2">
              <Input
                placeholder="Nova categoria"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </CardContent>
          </Card>

          {/* Lista */}
          <Card>
            <CardContent className="p-0">
              {categories.length === 0 ? (
                <div className="p-8 text-center space-y-4">
                  <p className="text-muted-foreground">
                    Nenhuma categoria cadastrada ainda.
                  </p>
                  <Button variant="outline" onClick={importDefaults}>
                    Importar categorias padrão
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-4 hover:bg-secondary/30"
                    >
                      {editingId === cat.id ? (
                        <>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleRename(cat.id)
                            }
                            autoFocus
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRename(cat.id)}
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {countByGenre(cat.name)} livro(s)
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditName(cat.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={async () => {
                              const ok = await deleteCategory(cat.id);
                              toast[ok ? "success" : "error"](
                                ok ? "Categoria removida." : "Falha ao remover."
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
