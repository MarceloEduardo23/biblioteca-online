"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle, X, Images } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";

const EMPTY = { title: "", description: "", imageUrl: "" };

export default function AdminDestaquesPage() {
  const { currentUser, slides, loading, addSlide, updateSlide, deleteSlide } =
    useLibrary();

  const isStaff =
    currentUser?.role === "admin" || currentUser?.role === "librarian";

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Informe um título.");
      return;
    }
    setSaving(true);
    const res = editingId
      ? await updateSlide(editingId, form)
      : await addSlide(form);
    setSaving(false);
    if (res.ok) {
      toast.success(editingId ? "Destaque atualizado." : "Destaque adicionado.");
      resetForm();
    } else {
      toast.error(res.error || "Não foi possível salvar.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 md:px-12 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Images className="h-7 w-7" />
              Destaques da Semana
            </h1>
            <p className="text-muted-foreground mt-1">
              Slides do carrossel da página inicial.
            </p>
          </div>

          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {editingId ? "Editar destaque" : "Novo destaque"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Imagem</Label>
                <ImageUpload
                  value={form.imageUrl}
                  onChange={(v) => setForm({ ...form, imageUrl: v })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {editingId ? (
                    <Pencil className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editingId ? "Salvar" : "Adicionar"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onClick={resetForm}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <Card>
            <CardContent className="p-0">
              {slides.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">
                  Nenhum destaque ainda. Adicione o primeiro acima.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {slides.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 p-4">
                      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded bg-secondary">
                        {s.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.imageUrl}
                            alt={s.title}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground line-clamp-1">
                          {s.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {s.description}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(s.id);
                          setForm({
                            title: s.title,
                            description: s.description,
                            imageUrl: s.imageUrl,
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={async () => {
                          const ok = await deleteSlide(s.id);
                          toast[ok ? "success" : "error"](
                            ok ? "Destaque removido." : "Falha ao remover."
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
