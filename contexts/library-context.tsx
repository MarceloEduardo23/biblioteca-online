"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User, Book, Category, LoanWithDetails } from "@/lib/types";

// ---------------------------------------------------------------------------
// Funções utilitárias para converter o JSON da API (datas vêm como string)
// de volta para objetos Date, que as telas usam (.toLocaleDateString etc).
// ---------------------------------------------------------------------------
function reviveUser(raw: any): User {
  return { ...raw, createdAt: new Date(raw.createdAt) };
}

function reviveLoan(raw: any): LoanWithDetails {
  return {
    ...raw,
    loanDate: new Date(raw.loanDate),
    dueDate: new Date(raw.dueDate),
    returnDate: raw.returnDate ? new Date(raw.returnDate) : undefined,
    book: raw.book as Book,
    user: reviveUser(raw.user),
  };
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Erro inesperado.");
  }
  return data;
}

export type AuthResult = { ok: boolean; error?: string };

interface LibraryContextType {
  currentUser: User | null;
  users: User[];
  books: Book[];
  categories: Category[];
  loans: LoanWithDetails[];
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  createLoan: (bookId: string) => Promise<LoanWithDetails | null>;
  createLoanFor: (
    bookId: string,
    target: { userId?: string; email?: string }
  ) => Promise<{ ok: boolean; error?: string; loan?: LoanWithDetails }>;
  returnBook: (loanId: string) => Promise<boolean>;
  getBookById: (id: string) => Book | undefined;
  getUserById: (id: string) => User | undefined;
  getUserLoans: (userId: string) => LoanWithDetails[];
  getAllLoansWithDetails: () => LoanWithDetails[];
  addBook: (book: Omit<Book, "id">) => Promise<Book | null>;
  updateBook: (id: string, book: Partial<Book>) => Promise<boolean>;
  deleteBook: (id: string) => Promise<boolean>;
  addUser: (user: {
    name: string;
    email: string;
    role: User["role"];
    password: string;
  }) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  addCategory: (name: string) => Promise<{ ok: boolean; error?: string }>;
  updateCategory: (id: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<boolean>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
    try {
      const data = await api("/api/books");
      setBooks(data.books as Book[]);
    } catch {
      setBooks([]);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api("/api/categories");
      setCategories(data.categories as Category[]);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadLoans = useCallback(async () => {
    try {
      const data = await api("/api/loans");
      setLoans((data.loans as any[]).map(reviveLoan));
    } catch {
      setLoans([]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api("/api/users");
      setUsers((data.users as any[]).map(reviveUser));
    } catch {
      setUsers([]);
    }
  }, []);

  // Carrega os dados que dependem do papel do usuário logado.
  const refreshForUser = useCallback(
    async (user: User | null) => {
      const jobs: Promise<unknown>[] = [];
      if (user) {
        jobs.push(loadLoans());
        if (user.role === "admin") jobs.push(loadUsers());
      } else {
        setLoans([]);
        setUsers([]);
      }
      await Promise.all(jobs);
    },
    [loadLoans, loadUsers]
  );

  // Bootstrap inicial: descobre quem está logado e carrega o catálogo.
  useEffect(() => {
    (async () => {
      try {
        const me = await api("/api/auth/me");
        const user = me.user ? reviveUser(me.user) : null;
        setCurrentUser(user);
        await Promise.all([loadBooks(), loadCategories(), refreshForUser(user)]);
      } catch {
        // segue em frente mesmo se algo falhar (ex.: banco ainda não configurado)
      } finally {
        setLoading(false);
      }
    })();
  }, [loadBooks, loadCategories, refreshForUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const user = reviveUser(data.user);
        setCurrentUser(user);
        await refreshForUser(user);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro ao entrar." };
      }
    },
    [refreshForUser]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      try {
        const data = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        const user = reviveUser(data.user);
        setCurrentUser(user);
        await refreshForUser(user);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro ao cadastrar." };
      }
    },
    [refreshForUser]
  );

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // ignora
    }
    setCurrentUser(null);
    setLoans([]);
    setUsers([]);
  }, []);

  const getBookById = useCallback((id: string) => books.find((b) => b.id === id), [books]);
  const getUserById = useCallback((id: string) => users.find((u) => u.id === id), [users]);

  const getUserLoans = useCallback(
    (userId: string) => loans.filter((l) => l.userId === userId),
    [loans]
  );

  const getAllLoansWithDetails = useCallback(() => loans, [loans]);

  // Mantém a lista de livros em sincronia usando o book devolvido pela API.
  const syncBookFromLoan = useCallback((loan: LoanWithDetails) => {
    setBooks((prev) => prev.map((b) => (b.id === loan.book.id ? loan.book : b)));
  }, []);

  const createLoan = useCallback(
    async (bookId: string): Promise<LoanWithDetails | null> => {
      try {
        const data = await api("/api/loans", {
          method: "POST",
          body: JSON.stringify({ bookId }),
        });
        const loan = reviveLoan(data.loan);
        setLoans((prev) => [loan, ...prev]);
        syncBookFromLoan(loan);
        return loan;
      } catch {
        return null;
      }
    },
    [syncBookFromLoan]
  );

  const createLoanFor = useCallback(
    async (
      bookId: string,
      target: { userId?: string; email?: string }
    ): Promise<{ ok: boolean; error?: string; loan?: LoanWithDetails }> => {
      try {
        const data = await api("/api/loans", {
          method: "POST",
          body: JSON.stringify({
            bookId,
            userId: target.userId,
            userEmail: target.email,
          }),
        });
        const loan = reviveLoan(data.loan);
        setLoans((prev) => [loan, ...prev]);
        syncBookFromLoan(loan);
        return { ok: true, loan };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Erro ao registrar empréstimo.",
        };
      }
    },
    [syncBookFromLoan]
  );

  const returnBook = useCallback(
    async (loanId: string): Promise<boolean> => {
      try {
        const data = await api(`/api/loans/${loanId}/return`, { method: "POST" });
        const loan = reviveLoan(data.loan);
        setLoans((prev) => prev.map((l) => (l.id === loan.id ? loan : l)));
        syncBookFromLoan(loan);
        return true;
      } catch {
        return false;
      }
    },
    [syncBookFromLoan]
  );

  const addBook = useCallback(async (book: Omit<Book, "id">): Promise<Book | null> => {
    try {
      const data = await api("/api/books", {
        method: "POST",
        body: JSON.stringify(book),
      });
      const created = data.book as Book;
      setBooks((prev) => [created, ...prev]);
      return created;
    } catch {
      return null;
    }
  }, []);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>): Promise<boolean> => {
    try {
      const data = await api(`/api/books/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const updated = data.book as Book;
      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteBook = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api(`/api/books/${id}`, { method: "DELETE" });
      setBooks((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const addUser = useCallback(
    async (user: {
      name: string;
      email: string;
      role: User["role"];
      password: string;
    }): Promise<User | null> => {
      try {
        const data = await api("/api/users", {
          method: "POST",
          body: JSON.stringify(user),
        });
        const created = reviveUser(data.user);
        setUsers((prev) => [created, ...prev]);
        return created;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const addCategory = useCallback(
    async (name: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const data = await api("/api/categories", {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        setCategories((prev) =>
          [...prev, data.category as Category].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro." };
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, name: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const data = await api(`/api/categories/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ name }),
        });
        const updated = data.category as Category;
        setCategories((prev) =>
          prev
            .map((c) => (c.id === id ? updated : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        await loadBooks();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro." };
      }
    },
    [loadBooks]
  );

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api(`/api/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <LibraryContext.Provider
      value={{
        currentUser,
        users,
        books,
        categories,
        loans,
        loading,
        login,
        register,
        logout,
        createLoan,
        createLoanFor,
        returnBook,
        getBookById,
        getUserById,
        getUserLoans,
        getAllLoansWithDetails,
        addBook,
        updateBook,
        deleteBook,
        addUser,
        deleteUser,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
