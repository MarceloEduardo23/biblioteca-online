"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  BookOpen,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Users,
  BookCopy,
  ScanLine,
  ChevronLeft,
} from "lucide-react";
import { useLibrary } from "@/contexts/library-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoginModal } from "@/components/login-modal";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onSearch, searchQuery }: HeaderProps) {
  const { currentUser, logout } = useLibrary();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const isStaff = currentUser?.role === "admin" || currentUser?.role === "librarian";

  const getRoleBadge = (role: string) => {
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
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between gap-4 px-4 md:px-12 h-16">
          {/* Voltar + Logo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {pathname !== "/" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground hidden sm:block">
                BiblioTech
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </Link>
            <Link
              href="/catalogo"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Catálogo
            </Link>
            {currentUser && (
              <Link
                href="/meus-emprestimos"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Meus Empréstimos
              </Link>
            )}
            {isStaff && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Painel Admin
              </Link>
            )}
            {isStaff && (
              <Link
                href="/admin/escanear"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Escanear
              </Link>
            )}
          </nav>

          {/* Search Bar */}
          {onSearch && (
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar livros..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-10 bg-secondary border-0"
                />
              </div>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {currentUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm text-foreground">
                      {currentUser.name.split(" ")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {getRoleBadge(currentUser.role)}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/meus-emprestimos" className="cursor-pointer">
                      <BookCopy className="mr-2 h-4 w-4" />
                      Meus Empréstimos
                    </Link>
                  </DropdownMenuItem>
                  {isStaff && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/escanear" className="cursor-pointer">
                          <ScanLine className="mr-2 h-4 w-4" />
                          Escanear
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/usuarios" className="cursor-pointer">
                          <Users className="mr-2 h-4 w-4" />
                          Gerenciar Usuários
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setLoginModalOpen(true)} variant="default" size="sm">
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            {onSearch && (
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar livros..."
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="pl-10 bg-secondary border-0"
                  />
                </div>
              </div>
            )}
            <nav className="flex flex-col p-4 pt-0 space-y-2">
              <Link
                href="/"
                className="py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/catalogo"
                className="py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Catálogo
              </Link>
              {currentUser && (
                <Link
                  href="/meus-emprestimos"
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Meus Empréstimos
                </Link>
              )}
              {isStaff && (
                <Link
                  href="/admin"
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Painel Admin
                </Link>
              )}
              {isStaff && (
                <Link
                  href="/admin/escanear"
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Escanear
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
