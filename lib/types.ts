export type UserRole = "admin" | "librarian" | "reader";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  isbn: string;
  description: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  rating: number;
}

export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  returnDate?: Date;
  pickedUpAt?: Date;
  renewals: number;
  status: "pending" | "active" | "returned" | "overdue";
}

export interface LoanWithDetails extends Loan {
  book: Book;
  user: User;
}
