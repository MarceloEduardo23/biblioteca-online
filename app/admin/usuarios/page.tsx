"use client";

import { useState } from "react";
import { Plus, Trash2, AlertCircle, Shield, BookOpen, User } from "lucide-react";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User as UserType, UserRole } from "@/lib/types";

export default function AdminUsuariosPage() {
  const { currentUser, users, addUser, deleteUser, loading } = useLibrary();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const isAdmin = currentUser?.role === "admin";

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

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 md:px-12 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página
          </p>
        </main>
      </div>
    );
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "librarian":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-500";
      case "librarian":
        return "bg-amber-500/20 text-amber-500";
      default:
        return "bg-emerald-500/20 text-emerald-500";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "librarian":
        return "Bibliotecário";
      default:
        return "Leitor";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 md:px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerenciar Usuários
              </h1>
              <p className="text-muted-foreground mt-1">
                {users.length} usuários cadastrados
              </p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                </DialogHeader>
                <UserForm
                  onSubmit={(data) => {
                    addUser(data);
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
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {user.name}
                        {user.id === currentUser.id && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (você)
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      disabled={user.id === currentUser.id}
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

function UserForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "reader" as UserRole,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Função</Label>
        <Select
          value={formData.role}
          onValueChange={(value: UserRole) =>
            setFormData({ ...formData, role: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reader">Leitor</SelectItem>
            <SelectItem value="librarian">Bibliotecário</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Adicionar</Button>
      </div>
    </form>
  );
}
